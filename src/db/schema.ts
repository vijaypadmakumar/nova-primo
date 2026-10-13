import {
  bigint,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** An agent's business. Every master and load belongs to exactly one office. */
export const offices = pgTable("offices", {
  id: id(),
  name: text("name").notNull(),
  city: text("city"),
  /** Last load number issued, used to number loads 1, 2, 3… per office. */
  loadSeq: integer("load_seq").notNull().default(0),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  /** Null until the user finishes onboarding and creates their office. */
  officeId: uuid("office_id").references(() => offices.id),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  createdAt: createdAt(),
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: id(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("otp_codes_phone_idx").on(t.phone, t.createdAt)],
);

export const sessions = pgTable("sessions", {
  /** SHA-256 of the session token; the token itself only lives in the cookie. */
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const shippers = pgTable(
  "shippers",
  {
    id: id(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    city: text("city"),
    gstin: text("gstin"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("shippers_office_idx").on(t.officeId)],
);

export const owners = pgTable(
  "owners",
  {
    id: id(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    name: text("name").notNull(),
    phone: text("phone"),
    city: text("city"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("owners_office_idx").on(t.officeId)],
);

export const drivers = pgTable(
  "drivers",
  {
    id: id(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    ownerId: uuid("owner_id").references(() => owners.id),
    name: text("name").notNull(),
    phone: text("phone"),
    /** Language the driver's trip page and messages are sent in. */
    language: text("language").notNull().default("hi"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("drivers_office_idx").on(t.officeId)],
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: id(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    ownerId: uuid("owner_id").references(() => owners.id),
    number: text("number").notNull(),
    truckType: text("truck_type"),
    capacityKg: integer("capacity_kg"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("vehicles_office_idx").on(t.officeId),
    uniqueIndex("vehicles_office_number_idx").on(t.officeId, t.number),
  ],
);

export const LOAD_STAGES = [
  "open",
  "assigned",
  "in_transit",
  "delivered",
  "closed",
  "cancelled",
] as const;
export type LoadStage = (typeof LOAD_STAGES)[number];

export const loads = pgTable(
  "loads",
  {
    id: id(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id),
    loadNo: integer("load_no").notNull(),
    shipperId: uuid("shipper_id")
      .notNull()
      .references(() => shippers.id),
    fromPlace: text("from_place").notNull(),
    toPlace: text("to_place").notNull(),
    material: text("material"),
    weightKg: integer("weight_kg"),
    truckType: text("truck_type"),
    loadingDate: date("loading_date").notNull(),
    /** Freight agreed with the shipper, in paise. */
    shipperFreightPaise: bigint("shipper_freight_paise", { mode: "number" }),
    stage: text("stage").$type<LoadStage>().notNull().default("open"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("loads_office_no_idx").on(t.officeId, t.loadNo),
    index("loads_office_stage_idx").on(t.officeId, t.stage),
    index("loads_shipper_idx").on(t.shipperId),
  ],
);

export type Office = typeof offices.$inferSelect;
export type User = typeof users.$inferSelect;
export type Shipper = typeof shippers.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Load = typeof loads.$inferSelect;
