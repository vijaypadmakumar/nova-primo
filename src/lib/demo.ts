import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { DocumentType, LoadStage, TripStatus } from "@/db/schema";
import { todayInIndia } from "./format";

/*
 * Sample data for the demo sandbox: one Bengaluru booking office with its
 * usual parties, truck owners, drivers and a few weeks of loads in every stage.
 * Dates are relative to today so the demo always looks current.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const rupees = (r: number) => r * 100;

function dayOffset(days: number): string {
  const d = new Date(`${todayInIndia()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A time on a given day, in India (UTC+5:30). */
function at(days: number, hour: number, minute = 0): Date {
  return new Date(`${dayOffset(days)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`);
}

const PARTIES = [
  { key: "cement", name: "Shree Cement Traders", contactPerson: "Mahesh Agarwal", phone: "+919845012345", city: "Bengaluru", gstin: "29AAACS1234F1Z5" },
  { key: "agro", name: "Kaveri Agro Foods", contactPerson: "Lakshmi N", phone: "+919880234567", city: "Mysuru" },
  { key: "steel", name: "Deccan Steel Works", contactPerson: "Prakash Rao", phone: "+919731345678", city: "Hosur", gstin: "33AABCD5678K1Z2" },
  { key: "textile", name: "Ganesh Textiles", contactPerson: "Senthil Kumar", phone: "+919443456789", city: "Tiruppur" },
  { key: "coffee", name: "Malnad Coffee Exports", contactPerson: "Ravi Hegde", phone: "+919900567890", city: "Hassan" },
] as const;

const OWNERS = [
  { key: "raju", name: "Raju Transport (Ramesh Gowda)", phone: "+919845098765", city: "Bengaluru" },
  { key: "murugan", name: "Murugan Roadways", phone: "+919443087654", city: "Salem" },
  { key: "singh", name: "Singh Carriers (Harpreet Singh)", phone: "+919815076543", city: "Ludhiana" },
] as const;

const DRIVERS = [
  { key: "manju", name: "Manjunath K", phone: "+919741011223", language: "kn", owner: "raju" },
  { key: "selvam", name: "Selvam R", phone: "+919442022334", language: "ta", owner: "murugan" },
  { key: "gurpreet", name: "Gurpreet Singh", phone: "+919814033445", language: "pa", owner: "singh" },
  { key: "ramesh", name: "Ramesh Yadav", phone: "+919631044556", language: "hi", owner: "raju" },
  { key: "imran", name: "Imran Khan", phone: "+919845055667", language: "hi", owner: "murugan" },
] as const;

const VEHICLES = [
  { key: "ka01", number: "KA01AB4521", truckType: "open_body", capacityKg: 16000, owner: "raju" },
  { key: "ka51", number: "KA51C7788", truckType: "container", capacityKg: 9000, owner: "raju" },
  { key: "tn38", number: "TN38BZ1122", truckType: "trailer", capacityKg: 25000, owner: "murugan" },
  { key: "pb10", number: "PB10GH3344", truckType: "open_body", capacityKg: 21000, owner: "singh" },
  { key: "tn30", number: "TN30Q9090", truckType: "open_body", capacityKg: 16000, owner: "murugan" },
] as const;

type PartyKey = (typeof PARTIES)[number]["key"];
type DriverKey = (typeof DRIVERS)[number]["key"];
type VehicleKey = (typeof VEHICLES)[number]["key"];

type DemoLoad = {
  party: PartyKey;
  from: string;
  to: string;
  material: string;
  tonnes: number;
  truckType: string;
  day: number;
  freight: number;
  stage: LoadStage;
  trip?: string;
  partyPaid?: boolean;
};

type DemoTrip = {
  key: string;
  vehicle: VehicleKey;
  driver: DriverKey;
  hire: number;
  advance: number;
  ownerPaid?: boolean;
  events: [TripStatus, number, number][];
  documents: [DocumentType, number, number][];
};

const TRIPS: DemoTrip[] = [
  // Closed last week: both sides paid.
  { key: "t1", vehicle: "tn38", driver: "selvam", hire: 52000, advance: 35000, ownerPaid: true,
    events: [["reached_pickup", -9, 7], ["loaded", -9, 11], ["departed", -9, 12], ["reached_drop", -8, 9], ["unloaded", -8, 14]],
    documents: [["lr", -9, 11], ["eway_bill", -9, 11], ["pod", -8, 15]] },
  { key: "t2", vehicle: "ka01", driver: "manju", hire: 21500, advance: 15000, ownerPaid: true,
    events: [["reached_pickup", -7, 8], ["loaded", -7, 10], ["departed", -7, 11], ["reached_drop", -7, 17], ["unloaded", -6, 10]],
    documents: [["lr", -7, 10], ["pod", -6, 11]] },
  // Delivered: POD in, payment pending.
  { key: "t3", vehicle: "pb10", driver: "gurpreet", hire: 38000, advance: 25000,
    events: [["reached_pickup", -4, 6], ["loaded", -4, 9], ["departed", -4, 10], ["reached_drop", -3, 8], ["unloaded", -3, 12]],
    documents: [["lr", -4, 9], ["eway_bill", -4, 9], ["pod", -3, 13]] },
  // Delivered: POD still missing.
  { key: "t4", vehicle: "ka51", driver: "ramesh", hire: 18000, advance: 12000,
    events: [["reached_pickup", -3, 7], ["loaded", -3, 9], ["departed", -3, 10], ["reached_drop", -2, 16], ["unloaded", -1, 9]],
    documents: [["lr", -3, 9]] },
  // On the way, carrying loads for two parties.
  { key: "t5", vehicle: "tn30", driver: "imran", hire: 46000, advance: 30000,
    events: [["reached_pickup", -1, 7], ["loaded", -1, 12], ["departed", -1, 14]],
    documents: [["lr", -1, 12], ["eway_bill", -1, 12]] },
  // On the way.
  { key: "t6", vehicle: "ka01", driver: "manju", hire: 24000, advance: 16000,
    events: [["reached_pickup", 0, 6], ["loaded", 0, 8], ["departed", 0, 9]],
    documents: [["lr", 0, 8]] },
  // Truck fixed, loading later today.
  { key: "t7", vehicle: "tn38", driver: "selvam", hire: 55000, advance: 30000, events: [], documents: [] },
];

const LOADS: DemoLoad[] = [
  { party: "steel", from: "Hosur", to: "Pune", material: "Steel coils", tonnes: 24, truckType: "trailer", day: -9, freight: 58000, stage: "closed", trip: "t1", partyPaid: true },
  { party: "cement", from: "Bengaluru", to: "Chennai", material: "Cement bags", tonnes: 15, truckType: "open_body", day: -7, freight: 25000, stage: "closed", trip: "t2", partyPaid: true },
  { party: "coffee", from: "Hassan", to: "Kochi Port", material: "Coffee beans", tonnes: 20, truckType: "open_body", day: -4, freight: 43000, stage: "delivered", trip: "t3" },
  { party: "agro", from: "Mysuru", to: "Hyderabad", material: "Rice bags", tonnes: 9, truckType: "container", day: -3, freight: 21500, stage: "delivered", trip: "t4" },
  { party: "textile", from: "Tiruppur", to: "Bengaluru", material: "Cotton garments", tonnes: 6, truckType: "open_body", day: -1, freight: 22000, stage: "in_transit", trip: "t5" },
  { party: "agro", from: "Tiruppur", to: "Bengaluru", material: "Coconut oil tins", tonnes: 8, truckType: "open_body", day: -1, freight: 30000, stage: "in_transit", trip: "t5" },
  { party: "cement", from: "Bengaluru", to: "Hubballi", material: "Cement bags", tonnes: 16, truckType: "open_body", day: 0, freight: 28000, stage: "in_transit", trip: "t6" },
  { party: "steel", from: "Hosur", to: "Mumbai", material: "TMT bars", tonnes: 25, truckType: "trailer", day: 0, freight: 64000, stage: "assigned", trip: "t7" },
  { party: "cement", from: "Bengaluru", to: "Chennai", material: "Cement bags", tonnes: 16, truckType: "open_body", day: 0, freight: 26000, stage: "open" },
  { party: "coffee", from: "Hassan", to: "Mangaluru Port", material: "Coffee beans", tonnes: 18, truckType: "container", day: 1, freight: 24000, stage: "open" },
  { party: "textile", from: "Tiruppur", to: "Hyderabad", material: "Cotton yarn", tonnes: 10, truckType: "open_body", day: 1, freight: 34000, stage: "open" },
];

async function seed(tx: Tx, officeId: string) {
  const ids = <K extends string>(rows: { id: string }[], keys: readonly { key: K }[]) =>
    Object.fromEntries(keys.map((k, i) => [k.key, rows[i].id])) as Record<K, string>;

  const party = ids(
    await tx
      .insert(schema.shippers)
      .values(PARTIES.map(({ key: _key, ...p }) => ({ ...p, officeId })))
      .returning({ id: schema.shippers.id }),
    PARTIES,
  );
  const owner = ids(
    await tx
      .insert(schema.owners)
      .values(OWNERS.map(({ key: _key, ...o }) => ({ ...o, officeId })))
      .returning({ id: schema.owners.id }),
    OWNERS,
  );
  const driver = ids(
    await tx
      .insert(schema.drivers)
      .values(DRIVERS.map(({ key: _key, owner: o, ...d }) => ({ ...d, ownerId: owner[o], officeId })))
      .returning({ id: schema.drivers.id }),
    DRIVERS,
  );
  const vehicle = ids(
    await tx
      .insert(schema.vehicles)
      .values(VEHICLES.map(({ key: _key, owner: o, ...v }) => ({ ...v, ownerId: owner[o], officeId })))
      .returning({ id: schema.vehicles.id }),
    VEHICLES,
  );

  const tripIds: Record<string, string> = {};
  for (const t of TRIPS) {
    const [trip] = await tx
      .insert(schema.trips)
      .values({
        officeId,
        vehicleId: vehicle[t.vehicle],
        driverId: driver[t.driver],
        truckFreightPaise: rupees(t.hire),
        advancePaise: rupees(t.advance),
        ownerPaidAt: t.ownerPaid ? at(-2, 11) : null,
      })
      .returning({ id: schema.trips.id });
    tripIds[t.key] = trip.id;
    if (t.events.length) {
      await tx.insert(schema.tripEvents).values(t.events.map(([status, d, h]) => ({ tripId: trip.id, status, at: at(d, h) })));
    }
    if (t.documents.length) {
      await tx.insert(schema.tripDocuments).values(t.documents.map(([type, d, h]) => ({ tripId: trip.id, type, at: at(d, h) })));
    }
  }

  await tx.insert(schema.loads).values(
    LOADS.map((l, i) => ({
      officeId,
      loadNo: i + 1,
      shipperId: party[l.party],
      fromPlace: l.from,
      toPlace: l.to,
      material: l.material,
      weightKg: l.tonnes * 1000,
      truckType: l.truckType,
      loadingDate: dayOffset(l.day),
      shipperFreightPaise: rupees(l.freight),
      stage: l.stage,
      tripId: l.trip ? tripIds[l.trip] : null,
      partyPaidAt: l.partyPaid ? at(-2, 10) : null,
    })),
  );
  await tx.update(schema.offices).set({ loadSeq: LOADS.length }).where(eq(schema.offices.id, officeId));
}

/** Creates a fresh demo office with sample data and its demo user. */
export async function createDemoOffice(name: string) {
  return db.transaction(async (tx) => {
    const [office] = await tx
      .insert(schema.offices)
      .values({ name: "Sri Balaji Transport", city: "Bengaluru", isDemo: true })
      .returning({ id: schema.offices.id });
    const [user] = await tx
      .insert(schema.users)
      .values({ officeId: office.id, phone: `demo:${crypto.randomUUID()}`, name })
      .returning({ id: schema.users.id });
    await seed(tx, office.id);
    return { officeId: office.id, userId: user.id };
  });
}

/** Puts a demo office back to the starting sample data. */
export async function resetDemoOffice(officeId: string) {
  await db.transaction(async (tx) => {
    const [office] = await tx.select().from(schema.offices).where(eq(schema.offices.id, officeId));
    if (!office?.isDemo) throw new Error("Only a demo office can be reset");
    const tripRows = await tx.select({ id: schema.trips.id }).from(schema.trips).where(eq(schema.trips.officeId, officeId));
    await tx.delete(schema.loads).where(eq(schema.loads.officeId, officeId));
    if (tripRows.length) await tx.delete(schema.trips).where(inArray(schema.trips.id, tripRows.map((t) => t.id)));
    await tx.delete(schema.vehicles).where(eq(schema.vehicles.officeId, officeId));
    await tx.delete(schema.drivers).where(eq(schema.drivers.officeId, officeId));
    await tx.delete(schema.owners).where(eq(schema.owners.officeId, officeId));
    await tx.delete(schema.shippers).where(eq(schema.shippers.officeId, officeId));
    await seed(tx, officeId);
  });
}
