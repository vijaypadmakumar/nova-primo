import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { LoadStage } from "@/db/schema";
import { todayInIndia } from "./format";

const { loads, trips, shippers, drivers, owners, vehicles, tripEvents, tripDocuments } = schema;

const RUNNING: LoadStage[] = ["assigned", "in_transit"];
const DONE: LoadStage[] = ["delivered", "closed"];

async function officeData(officeId: string) {
  const [loadRows, tripRows, events, docs] = await Promise.all([
    db
      .select({ load: loads, shipperName: shippers.name })
      .from(loads)
      .innerJoin(shippers, eq(loads.shipperId, shippers.id))
      .where(eq(loads.officeId, officeId)),
    db
      .select({ trip: trips, driverName: drivers.name, driverId: drivers.id, vehicleNumber: vehicles.number, ownerName: owners.name })
      .from(trips)
      .innerJoin(drivers, eq(trips.driverId, drivers.id))
      .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .leftJoin(owners, eq(vehicles.ownerId, owners.id))
      .where(eq(trips.officeId, officeId)),
    db
      .select({ tripId: tripEvents.tripId, status: tripEvents.status })
      .from(tripEvents)
      .innerJoin(trips, eq(tripEvents.tripId, trips.id))
      .where(eq(trips.officeId, officeId)),
    db
      .select({ tripId: tripDocuments.tripId, type: tripDocuments.type })
      .from(tripDocuments)
      .innerJoin(trips, eq(tripDocuments.tripId, trips.id))
      .where(eq(trips.officeId, officeId)),
  ]);
  return { loadRows, tripRows, events, docs };
}

/** The money and follow-up numbers on the home screen. Amounts in paise. */
export async function moneySummary(officeId: string) {
  const { loadRows, tripRows, events, docs } = await officeData(officeId);
  const month = todayInIndia().slice(0, 7);
  const tripById = new Map(tripRows.map((t) => [t.trip.id, t.trip]));

  const monthLoads = loadRows.filter((r) => r.load.loadingDate.startsWith(month) && r.load.stage !== "cancelled" && r.load.tripId);
  const monthTripIds = new Set(monthLoads.map((r) => r.load.tripId!));
  const freight = monthLoads.reduce((s, r) => s + (r.load.shipperFreightPaise ?? 0), 0);
  const hire = [...monthTripIds].reduce((s, id) => s + (tripById.get(id)?.truckFreightPaise ?? 0), 0);

  const toCollect = loadRows
    .filter((r) => DONE.includes(r.load.stage) && !r.load.partyPaidAt)
    .reduce((s, r) => s + (r.load.shipperFreightPaise ?? 0), 0);

  const deliveredTripIds = new Set(loadRows.filter((r) => DONE.includes(r.load.stage) && r.load.tripId).map((r) => r.load.tripId!));
  const toPay = [...deliveredTripIds]
    .map((id) => tripById.get(id)!)
    .filter((t) => t && !t.ownerPaidAt)
    .reduce((s, t) => s + (t.truckFreightPaise ?? 0) - (t.advancePaise ?? 0), 0);

  const unloaded = new Set(events.filter((e) => e.status === "unloaded").map((e) => e.tripId));
  const withPod = new Set(docs.filter((d) => d.type === "pod").map((d) => d.tripId));
  const podMissing = [...unloaded].filter((id) => !withPod.has(id)).length;

  return { freight, hire, margin: freight - hire, toCollect, toPay, podMissing };
}

export type PartyLink = {
  id: string;
  name: string;
  loads: number;
  running: number;
  freight: number;
  toCollect: number;
  drivers: string[];
};

export type DriverLink = {
  id: string;
  name: string;
  ownerName: string | null;
  vehicles: string[];
  loads: number;
  running: number;
  parties: string[];
};

/** Who works with whom through this agent: each party's drivers and each driver's parties. */
export async function connections(officeId: string) {
  const { loadRows, tripRows } = await officeData(officeId);
  const tripById = new Map(tripRows.map((t) => [t.trip.id, t]));

  const parties = new Map<string, PartyLink>();
  const driversMap = new Map<string, DriverLink & { partySet: Set<string> }>();
  const pairs = new Map<string, { partyId: string; driverId: string; loads: number }>();

  for (const { load, shipperName } of loadRows) {
    if (load.stage === "cancelled") continue;
    const p = parties.get(load.shipperId) ?? {
      id: load.shipperId,
      name: shipperName,
      loads: 0,
      running: 0,
      freight: 0,
      toCollect: 0,
      drivers: [],
    };
    p.loads += 1;
    if (RUNNING.includes(load.stage)) p.running += 1;
    p.freight += load.shipperFreightPaise ?? 0;
    if (DONE.includes(load.stage) && !load.partyPaidAt) p.toCollect += load.shipperFreightPaise ?? 0;

    const trip = load.tripId ? tripById.get(load.tripId) : undefined;
    if (trip) {
      if (!p.drivers.includes(trip.driverName)) p.drivers.push(trip.driverName);
      const d = driversMap.get(trip.driverId) ?? {
        id: trip.driverId,
        name: trip.driverName,
        ownerName: trip.ownerName,
        vehicles: [],
        loads: 0,
        running: 0,
        parties: [],
        partySet: new Set<string>(),
      };
      d.loads += 1;
      if (RUNNING.includes(load.stage)) d.running += 1;
      if (!d.vehicles.includes(trip.vehicleNumber)) d.vehicles.push(trip.vehicleNumber);
      if (!d.partySet.has(shipperName)) {
        d.partySet.add(shipperName);
        d.parties.push(shipperName);
      }
      driversMap.set(trip.driverId, d);

      const key = `${load.shipperId}:${trip.driverId}`;
      const pair = pairs.get(key) ?? { partyId: load.shipperId, driverId: trip.driverId, loads: 0 };
      pair.loads += 1;
      pairs.set(key, pair);
    }
    parties.set(load.shipperId, p);
  }

  const byLoads = <T extends { loads: number; name: string }>(a: T, b: T) => b.loads - a.loads || a.name.localeCompare(b.name);
  return {
    parties: [...parties.values()].sort(byLoads),
    drivers: [...driversMap.values()].map(({ partySet: _s, ...d }) => d).sort(byLoads),
    pairs: [...pairs.values()],
  };
}
