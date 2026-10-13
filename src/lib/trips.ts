import "server-only";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { DocumentType, LoadStage, TripStatus } from "@/db/schema";

const { trips, loads, tripEvents, tripDocuments, vehicles, drivers, owners, shippers } = schema;

/** The load stage a driver's status tap moves the trip's loads to, if any. */
export function stageAfterStatus(status: TripStatus): LoadStage | null {
  switch (status) {
    case "loaded":
    case "departed":
    case "reached_drop":
      return "in_transit";
    case "unloaded":
      return "delivered";
    default:
      return null;
  }
}

/** Everything the load page and the driver's view need about one trip. */
export async function getTrip(officeId: string, tripId: string) {
  const [row] = await db
    .select({ trip: trips, vehicle: vehicles, driver: drivers, owner: owners })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .leftJoin(owners, eq(vehicles.ownerId, owners.id))
    .where(and(eq(trips.id, tripId), eq(trips.officeId, officeId)))
    .limit(1);
  if (!row) return null;

  const [tripLoads, events, documents] = await Promise.all([
    db
      .select({ load: loads, shipperName: shippers.name, shipperPhone: shippers.phone })
      .from(loads)
      .innerJoin(shippers, eq(loads.shipperId, shippers.id))
      .where(eq(loads.tripId, tripId))
      .orderBy(asc(loads.loadNo)),
    db.select().from(tripEvents).where(eq(tripEvents.tripId, tripId)).orderBy(asc(tripEvents.at)),
    db.select().from(tripDocuments).where(eq(tripDocuments.tripId, tripId)),
  ]);
  return { ...row, loads: tripLoads, events, documents };
}

export type TripDetail = NonNullable<Awaited<ReturnType<typeof getTrip>>>;

/** Trips that have not started moving, which another load can still join. */
export async function joinableTrips(officeId: string) {
  const rows = await db
    .select({
      tripId: trips.id,
      vehicleNumber: vehicles.number,
      driverName: drivers.name,
      stage: loads.stage,
      toPlace: loads.toPlace,
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .innerJoin(loads, eq(loads.tripId, trips.id))
    .where(eq(trips.officeId, officeId));
  const byTrip = new Map<string, { tripId: string; label: string; ok: boolean }>();
  for (const r of rows) {
    const cur = byTrip.get(r.tripId) ?? { tripId: r.tripId, label: `${r.vehicleNumber} · ${r.driverName} · ${r.toPlace}`, ok: true };
    if (r.stage !== "assigned") cur.ok = false;
    byTrip.set(r.tripId, cur);
  }
  return [...byTrip.values()].filter((t) => t.ok);
}

export async function createTripForLoad(
  officeId: string,
  loadId: string,
  input: { vehicleId: string; driverId: string; truckFreightPaise: number | null; advancePaise: number | null },
) {
  await db.transaction(async (tx) => {
    const [trip] = await tx
      .insert(trips)
      .values({ officeId, ...input })
      .returning({ id: trips.id });
    await tx
      .update(loads)
      .set({ tripId: trip.id, stage: "assigned", updatedAt: new Date() })
      .where(and(eq(loads.id, loadId), eq(loads.officeId, officeId), eq(loads.stage, "open")));
  });
}

export async function addLoadToTrip(officeId: string, loadId: string, tripId: string) {
  await db
    .update(loads)
    .set({ tripId, stage: "assigned", updatedAt: new Date() })
    .where(and(eq(loads.id, loadId), eq(loads.officeId, officeId), eq(loads.stage, "open")));
}

/** Take the truck off a load that has not moved yet. An empty trip is removed. */
export async function removeTruck(officeId: string, loadId: string) {
  await db.transaction(async (tx) => {
    const [load] = await tx
      .select({ tripId: loads.tripId, stage: loads.stage })
      .from(loads)
      .where(and(eq(loads.id, loadId), eq(loads.officeId, officeId)));
    if (!load?.tripId || load.stage !== "assigned") return;
    await tx.update(loads).set({ tripId: null, stage: "open", updatedAt: new Date() }).where(eq(loads.id, loadId));
    const left = await tx.select({ id: loads.id }).from(loads).where(eq(loads.tripId, load.tripId)).limit(1);
    if (left.length === 0) await tx.delete(trips).where(eq(trips.id, load.tripId));
  });
}

/** A status tap from the driver: logged, and the trip's loads move stage when it matters. */
export async function recordStatus(officeId: string, tripId: string, status: TripStatus, at = new Date()) {
  await db.transaction(async (tx) => {
    const [trip] = await tx
      .select({ id: trips.id })
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.officeId, officeId)));
    if (!trip) return;
    const [already] = await tx
      .select({ id: tripEvents.id })
      .from(tripEvents)
      .where(and(eq(tripEvents.tripId, tripId), eq(tripEvents.status, status)))
      .limit(1);
    if (already) return;
    await tx.insert(tripEvents).values({ tripId, status, at });
    const stage = stageAfterStatus(status);
    if (stage) {
      await tx
        .update(loads)
        .set({ stage, updatedAt: new Date() })
        .where(and(eq(loads.tripId, tripId), inArray(loads.stage, ["assigned", "in_transit"])));
    }
  });
}

export async function addDocument(officeId: string, tripId: string, type: DocumentType, at = new Date()) {
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.officeId, officeId)));
  if (!trip) return;
  await db.insert(tripDocuments).values({ tripId, type, at }).onConflictDoNothing();
}

/** Close every delivered load on the trip once the party and the owner are both paid. */
async function closeSettled(tripId: string) {
  const [trip] = await db.select({ ownerPaidAt: trips.ownerPaidAt }).from(trips).where(eq(trips.id, tripId));
  if (!trip?.ownerPaidAt) return;
  const rows = await db.select().from(loads).where(eq(loads.tripId, tripId));
  if (rows.every((l) => l.partyPaidAt && (l.stage === "delivered" || l.stage === "closed"))) {
    await db
      .update(loads)
      .set({ stage: "closed", updatedAt: new Date() })
      .where(and(eq(loads.tripId, tripId), eq(loads.stage, "delivered")));
  }
}

export async function markPartyPaid(officeId: string, loadId: string) {
  const [load] = await db
    .update(loads)
    .set({ partyPaidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(loads.id, loadId), eq(loads.officeId, officeId), isNull(loads.partyPaidAt)))
    .returning({ tripId: loads.tripId });
  if (load?.tripId) await closeSettled(load.tripId);
}

export async function markOwnerPaid(officeId: string, tripId: string) {
  await db
    .update(trips)
    .set({ ownerPaidAt: new Date() })
    .where(and(eq(trips.id, tripId), eq(trips.officeId, officeId), isNull(trips.ownerPaidAt)));
  await closeSettled(tripId);
}

export async function vehicleAndDriverOptions(officeId: string) {
  const [vs, ds] = await Promise.all([
    db
      .select({ id: vehicles.id, number: vehicles.number, truckType: vehicles.truckType, ownerName: owners.name })
      .from(vehicles)
      .leftJoin(owners, eq(vehicles.ownerId, owners.id))
      .where(eq(vehicles.officeId, officeId))
      .orderBy(asc(vehicles.number)),
    db
      .select({ id: drivers.id, name: drivers.name, phone: drivers.phone })
      .from(drivers)
      .where(eq(drivers.officeId, officeId))
      .orderBy(asc(drivers.name)),
  ]);
  return { vehicles: vs, drivers: ds };
}

export async function belongsToOffice(table: "vehicles" | "drivers" | "trips", id: string, officeId: string) {
  const t = { vehicles, drivers, trips }[table];
  const [row] = await db
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.id, id), eq(t.officeId, officeId)))
    .limit(1);
  return !!row;
}
