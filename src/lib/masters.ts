import "server-only";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { driverSchema, ownerSchema, shipperSchema, vehicleSchema } from "./validation";

/*
 * The four "masters" (Tally's word for the people and things you record once and
 * reuse): shippers, truck owners, drivers and vehicles. Every query here is
 * scoped to one office.
 */

export const MASTER_KINDS = ["shippers", "owners", "drivers", "vehicles"] as const;
export type MasterKind = (typeof MASTER_KINDS)[number];

export function isMasterKind(v: string): v is MasterKind {
  return (MASTER_KINDS as readonly string[]).includes(v);
}

export const masterSchemas = {
  shippers: shipperSchema,
  owners: ownerSchema,
  drivers: driverSchema,
  vehicles: vehicleSchema,
};

const tables = {
  shippers: schema.shippers,
  owners: schema.owners,
  drivers: schema.drivers,
  vehicles: schema.vehicles,
};

export async function countMasters(officeId: string): Promise<Record<MasterKind, number>> {
  const counts = await Promise.all(
    MASTER_KINDS.map(async (kind) => {
      const table = tables[kind];
      const [row] = await db.select({ n: count() }).from(table).where(eq(table.officeId, officeId));
      return [kind, row?.n ?? 0] as const;
    }),
  );
  return Object.fromEntries(counts) as Record<MasterKind, number>;
}

export async function listShippers(officeId: string, q?: string) {
  const t = schema.shippers;
  const search = q ? `%${q}%` : null;
  return db
    .select()
    .from(t)
    .where(
      and(
        eq(t.officeId, officeId),
        search ? or(ilike(t.name, search), ilike(t.city, search), ilike(t.phone, search)) : undefined,
      ),
    )
    .orderBy(asc(t.name));
}

export async function listOwners(officeId: string, q?: string) {
  const t = schema.owners;
  const search = q ? `%${q}%` : null;
  return db
    .select()
    .from(t)
    .where(
      and(
        eq(t.officeId, officeId),
        search ? or(ilike(t.name, search), ilike(t.city, search), ilike(t.phone, search)) : undefined,
      ),
    )
    .orderBy(asc(t.name));
}

export async function listDrivers(officeId: string, q?: string) {
  const t = schema.drivers;
  const search = q ? `%${q}%` : null;
  return db
    .select({ driver: t, ownerName: schema.owners.name })
    .from(t)
    .leftJoin(schema.owners, eq(t.ownerId, schema.owners.id))
    .where(
      and(
        eq(t.officeId, officeId),
        search ? or(ilike(t.name, search), ilike(t.phone, search), ilike(schema.owners.name, search)) : undefined,
      ),
    )
    .orderBy(asc(t.name));
}

export async function listVehicles(officeId: string, q?: string) {
  const t = schema.vehicles;
  const search = q ? `%${q.replace(/[^A-Za-z0-9]/g, "")}%` : null;
  return db
    .select({ vehicle: t, ownerName: schema.owners.name })
    .from(t)
    .leftJoin(schema.owners, eq(t.ownerId, schema.owners.id))
    .where(
      and(
        eq(t.officeId, officeId),
        search ? or(ilike(t.number, search), ilike(schema.owners.name, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(asc(t.number));
}

export async function getMaster(kind: MasterKind, officeId: string, id: string) {
  const table = tables[kind];
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(table.id, id), eq(table.officeId, officeId)))
    .limit(1);
  return row ?? null;
}

/** Shippers for a dropdown. */
export async function shipperOptions(officeId: string) {
  return db
    .select({ id: schema.shippers.id, name: schema.shippers.name, city: schema.shippers.city })
    .from(schema.shippers)
    .where(eq(schema.shippers.officeId, officeId))
    .orderBy(asc(schema.shippers.name));
}

/** Owners for a dropdown. */
export async function ownerOptions(officeId: string) {
  return db
    .select({ id: schema.owners.id, name: schema.owners.name })
    .from(schema.owners)
    .where(eq(schema.owners.officeId, officeId))
    .orderBy(asc(schema.owners.name));
}

export async function ownerBelongsToOffice(ownerId: string, officeId: string) {
  return (await getMaster("owners", officeId, ownerId)) !== null;
}

/** Turn validated form values into the row to store. */
export function masterRow(kind: MasterKind, data: Record<string, unknown>) {
  if (kind === "vehicles") {
    const { capacity, ...rest } = data as { capacity: number | null } & Record<string, unknown>;
    return { ...rest, capacityKg: capacity };
  }
  return data;
}

export async function insertMaster(kind: MasterKind, officeId: string, row: Record<string, unknown>) {
  const table = tables[kind];
  const [created] = await db
    .insert(table)
    .values({ ...row, officeId } as typeof table.$inferInsert)
    .returning({ id: table.id });
  return created.id;
}

export async function updateMaster(kind: MasterKind, officeId: string, id: string, row: Record<string, unknown>) {
  const table = tables[kind];
  await db
    .update(table)
    .set(row)
    .where(and(eq(table.id, id), eq(table.officeId, officeId)));
}
