import { describe, expect, it } from "vitest";
import { loadSchema, shipperSchema, vehicleSchema } from "../validation";

const shipperId = "6f1c1d3e-8a7b-4c2d-9e0f-123456789abc";

describe("load form", () => {
  it("turns typed values into stored values", () => {
    const parsed = loadSchema.parse({
      shipperId,
      fromPlace: " Bengaluru ",
      toPlace: "Chennai",
      material: "",
      weight: "9.5",
      truckType: "open_body",
      loadingDate: "2026-10-13",
      freight: "45,000",
      notes: "",
    });
    expect(parsed).toMatchObject({
      fromPlace: "Bengaluru",
      material: null,
      weight: 9500,
      truckType: "open_body",
      freight: 4_500_000,
      notes: null,
    });
  });

  it("names the field that needs fixing", () => {
    const result = loadSchema.safeParse({
      shipperId: "",
      fromPlace: "",
      toPlace: "Chennai",
      loadingDate: "2026-10-13",
      freight: "lots",
    });
    expect(result.success).toBe(false);
    const issues = Object.fromEntries(result.error!.issues.map((i) => [i.path[0], i.message]));
    expect(issues).toMatchObject({ shipperId: "chooseShipper", fromPlace: "required", freight: "invalidAmount" });
  });

  it("only accepts known truck types", () => {
    const result = loadSchema.safeParse({
      shipperId,
      fromPlace: "A",
      toPlace: "B",
      loadingDate: "2026-10-13",
      truckType: "spaceship",
    });
    expect(result.success).toBe(false);
  });
});

describe("masters", () => {
  it("cleans up vehicle numbers", () => {
    expect(vehicleSchema.parse({ number: "ka 01 ab-1234", capacity: "16" })).toMatchObject({
      number: "KA01AB1234",
      capacity: 16000,
      ownerId: null,
    });
    expect(vehicleSchema.safeParse({ number: "" }).success).toBe(false);
  });

  it("checks optional phone and GSTIN only when given", () => {
    expect(shipperSchema.parse({ name: "Shree Traders", phone: "", gstin: "" })).toMatchObject({
      phone: null,
      gstin: null,
    });
    expect(shipperSchema.parse({ name: "Shree Traders", gstin: "29abcde1234f1z5" }).gstin).toBe("29ABCDE1234F1Z5");
    expect(shipperSchema.safeParse({ name: "Shree Traders", phone: "123" }).success).toBe(false);
  });
});
