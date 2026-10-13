import { z } from "zod";
import { parseRupeesToPaise, parseTonnesToKg } from "./format";
import { normalizeIndianMobile } from "./phone";

/*
 * Form schemas. Error messages are translation keys under "validation".
 * Each schema turns what was typed into the values stored in the database.
 */

const blankToNull = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

const requiredText = (max = 120) => z.string().trim().min(1, "required").max(max, "tooLong");
const optionalText = (max = 500) =>
  z.string().max(max, "tooLong").optional().transform(blankToNull);

export const optionalPhone = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v || v.trim() === "") return null;
    const phone = normalizeIndianMobile(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "invalidPhone" });
      return z.NEVER;
    }
    return phone;
  });

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, "invalidChoice");

export const DRIVER_LANGUAGES = ["hi", "en", "ta", "te", "kn", "ml", "mr", "bn", "pa", "gu"] as const;

export const TRUCK_TYPES = [
  "open_body",
  "container",
  "trailer",
  "tipper",
  "tanker",
  "reefer",
  "lcv",
] as const;

const optionalTruckType = z
  .string()
  .optional()
  .transform(blankToNull)
  .refine((v) => v === null || (TRUCK_TYPES as readonly string[]).includes(v), "invalidChoice");

export const shipperSchema = z.object({
  name: requiredText(),
  contactPerson: optionalText(80),
  phone: optionalPhone,
  city: optionalText(80),
  gstin: z
    .string()
    .optional()
    .transform((v) => blankToNull(v)?.toUpperCase() ?? null)
    .refine((v) => v === null || /^\d{2}[A-Z0-9]{13}$/.test(v), "invalidGstin"),
  notes: optionalText(),
});

export const ownerSchema = z.object({
  name: requiredText(),
  phone: optionalPhone,
  city: optionalText(80),
  notes: optionalText(),
});

export const driverSchema = z.object({
  name: requiredText(),
  phone: optionalPhone,
  ownerId: optionalId,
  language: z.enum(DRIVER_LANGUAGES, { message: "invalidChoice" }),
  notes: optionalText(),
});

/** "ka 01 ab-1234" → "KA01AB1234" */
export function normalizeVehicleNumber(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export const vehicleSchema = z.object({
  number: z
    .string()
    .transform(normalizeVehicleNumber)
    .refine((v) => v.length > 0, "required")
    .refine((v) => v === "" || /^[A-Z0-9]{6,11}$/.test(v), "invalidVehicleNumber"),
  truckType: optionalTruckType,
  capacity: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const kg = parseTonnesToKg(v);
      if (Number.isNaN(kg)) {
        ctx.addIssue({ code: "custom", message: "invalidNumber" });
        return z.NEVER;
      }
      return kg;
    }),
  ownerId: optionalId,
  notes: optionalText(),
});

export const loadSchema = z.object({
  shipperId: z.string().uuid("chooseShipper"),
  fromPlace: requiredText(80),
  toPlace: requiredText(80),
  material: optionalText(80),
  weight: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const kg = parseTonnesToKg(v);
      if (Number.isNaN(kg)) {
        ctx.addIssue({ code: "custom", message: "invalidNumber" });
        return z.NEVER;
      }
      return kg;
    }),
  truckType: optionalTruckType,
  loadingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDate"),
  freight: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const paise = parseRupeesToPaise(v);
      if (Number.isNaN(paise)) {
        ctx.addIssue({ code: "custom", message: "invalidAmount" });
        return z.NEVER;
      }
      return paise;
    }),
  notes: optionalText(),
});

export type ShipperInput = z.infer<typeof shipperSchema>;
export type OwnerInput = z.infer<typeof ownerSchema>;
export type DriverInput = z.infer<typeof driverSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type LoadInput = z.infer<typeof loadSchema>;
