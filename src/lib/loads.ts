import "server-only";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { LoadStage } from "@/db/schema";
import type { LoadInput } from "./validation";

const { loads, shippers, offices } = schema;

/** Stages shown on the load board, in working order. Cancelled loads sit apart. */
export const BOARD_STAGES = ["open", "assigned", "in_transit", "delivered", "closed"] as const;

export type LoadRow = {
  id: string;
  loadNo: number;
  loadingDate: string;
  fromPlace: string;
  toPlace: string;
  material: string | null;
  weightKg: number | null;
  truckType: string | null;
  shipperFreightPaise: number | null;
  stage: LoadStage;
  shipperId: string;
  shipperName: string;
};

const loadRowFields = {
  id: loads.id,
  loadNo: loads.loadNo,
  loadingDate: loads.loadingDate,
  fromPlace: loads.fromPlace,
  toPlace: loads.toPlace,
  material: loads.material,
  weightKg: loads.weightKg,
  truckType: loads.truckType,
  shipperFreightPaise: loads.shipperFreightPaise,
  stage: loads.stage,
  shipperId: loads.shipperId,
  shipperName: shippers.name,
};

export async function listLoads(
  officeId: string,
  opts: { stages?: LoadStage[]; q?: string; shipperId?: string; loadingDate?: string; limit?: number } = {},
): Promise<LoadRow[]> {
  const q = opts.q?.trim();
  const search = q ? `%${q}%` : null;
  const loadNo = q && /^\d+$/.test(q) ? Number(q) : null;
  return db
    .select(loadRowFields)
    .from(loads)
    .innerJoin(shippers, eq(loads.shipperId, shippers.id))
    .where(
      and(
        eq(loads.officeId, officeId),
        opts.stages ? inArray(loads.stage, opts.stages) : undefined,
        opts.shipperId ? eq(loads.shipperId, opts.shipperId) : undefined,
        opts.loadingDate ? eq(loads.loadingDate, opts.loadingDate) : undefined,
        search
          ? or(
              ilike(shippers.name, search),
              ilike(loads.fromPlace, search),
              ilike(loads.toPlace, search),
              ilike(loads.material, search),
              loadNo !== null ? eq(loads.loadNo, loadNo) : undefined,
            )
          : undefined,
      ),
    )
    .orderBy(desc(loads.loadingDate), desc(loads.loadNo))
    .limit(opts.limit ?? 200);
}

export async function stageCounts(officeId: string): Promise<Record<LoadStage, number>> {
  const rows = await db
    .select({ stage: loads.stage, n: count() })
    .from(loads)
    .where(eq(loads.officeId, officeId))
    .groupBy(loads.stage);
  const out = { open: 0, assigned: 0, in_transit: 0, delivered: 0, closed: 0, cancelled: 0 };
  for (const r of rows) out[r.stage] = r.n;
  return out;
}

export async function getLoad(officeId: string, id: string) {
  const [row] = await db
    .select({ load: loads, shipperName: shippers.name, shipperPhone: shippers.phone })
    .from(loads)
    .innerJoin(shippers, eq(loads.shipperId, shippers.id))
    .where(and(eq(loads.id, id), eq(loads.officeId, officeId)))
    .limit(1);
  return row ?? null;
}

function loadValues(input: LoadInput) {
  return {
    shipperId: input.shipperId,
    fromPlace: input.fromPlace,
    toPlace: input.toPlace,
    material: input.material,
    weightKg: input.weight,
    truckType: input.truckType,
    loadingDate: input.loadingDate,
    shipperFreightPaise: input.freight,
    notes: input.notes,
  };
}

/** Creates a load with the office's next load number (1, 2, 3…). */
export async function createLoad(officeId: string, userId: string, input: LoadInput) {
  return db.transaction(async (tx) => {
    const [{ loadSeq }] = await tx
      .update(offices)
      .set({ loadSeq: sql`${offices.loadSeq} + 1` })
      .where(eq(offices.id, officeId))
      .returning({ loadSeq: offices.loadSeq });
    const [created] = await tx
      .insert(loads)
      .values({ ...loadValues(input), officeId, loadNo: loadSeq, createdBy: userId })
      .returning({ id: loads.id, loadNo: loads.loadNo });
    return created;
  });
}

export async function updateLoad(officeId: string, id: string, input: LoadInput) {
  await db
    .update(loads)
    .set({ ...loadValues(input), updatedAt: new Date() })
    .where(and(eq(loads.id, id), eq(loads.officeId, officeId)));
}

export async function setLoadStage(officeId: string, id: string, stage: LoadStage) {
  await db
    .update(loads)
    .set({ stage, updatedAt: new Date() })
    .where(and(eq(loads.id, id), eq(loads.officeId, officeId)));
}

export type SavedRoute = { fromPlace: string; toPlace: string; material: string | null; truckType: string | null };

/** Each shipper's most recent distinct routes, offered as one-tap fills on the load form. */
export async function recentRoutesByShipper(officeId: string, perShipper = 4) {
  const rows = await db
    .select({
      shipperId: loads.shipperId,
      fromPlace: loads.fromPlace,
      toPlace: loads.toPlace,
      material: loads.material,
      truckType: loads.truckType,
    })
    .from(loads)
    .where(eq(loads.officeId, officeId))
    .orderBy(desc(loads.createdAt))
    .limit(500);

  const out: Record<string, SavedRoute[]> = {};
  for (const r of rows) {
    const list = (out[r.shipperId] ??= []);
    if (list.length >= perShipper) continue;
    const same = list.some(
      (x) => x.fromPlace.toLowerCase() === r.fromPlace.toLowerCase() && x.toPlace.toLowerCase() === r.toPlace.toLowerCase(),
    );
    if (!same) list.push({ fromPlace: r.fromPlace, toPlace: r.toPlace, material: r.material, truckType: r.truckType });
  }
  return out;
}

export async function shipperExists(officeId: string, shipperId: string) {
  const [row] = await db
    .select({ id: shippers.id })
    .from(shippers)
    .where(and(eq(shippers.id, shipperId), eq(shippers.officeId, officeId)))
    .limit(1);
  return !!row;
}
