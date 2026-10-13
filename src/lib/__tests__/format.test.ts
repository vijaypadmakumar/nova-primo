import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatRupees,
  formatTonnes,
  kgToTonnesInput,
  paiseToInput,
  parseRupeesToPaise,
  parseTonnesToKg,
  todayInIndia,
} from "../format";
import { formatIndianMobile, normalizeIndianMobile } from "../phone";

describe("money", () => {
  it("reads amounts the way agents type them", () => {
    expect(parseRupeesToPaise("45000")).toBe(4_500_000);
    expect(parseRupeesToPaise("45,000")).toBe(4_500_000);
    expect(parseRupeesToPaise("₹ 1,25,000.50")).toBe(12_500_050);
    expect(parseRupeesToPaise("")).toBeNull();
    expect(parseRupeesToPaise("forty")).toBeNaN();
    expect(parseRupeesToPaise("-500")).toBeNaN();
  });

  it("shows rupees with Indian grouping", () => {
    expect(formatRupees(12_500_000)).toBe("₹1,25,000");
    expect(formatRupees(null)).toBe("—");
    expect(paiseToInput(4_500_000)).toBe("45000");
    expect(paiseToInput(4_500_050)).toBe("45000.50");
  });
});

describe("weight", () => {
  it("converts tonnes to kilograms and back", () => {
    expect(parseTonnesToKg("9.5")).toBe(9500);
    expect(parseTonnesToKg("")).toBeNull();
    expect(parseTonnesToKg("nine")).toBeNaN();
    expect(formatTonnes(9500)).toBe("9.5 t");
    expect(formatTonnes(16000)).toBe("16 t");
    expect(kgToTonnesInput(9500)).toBe("9.5");
  });
});

describe("dates", () => {
  it("formats dates like Tally", () => {
    expect(formatDate("2026-10-13")).toBe("13-Oct-2026");
    expect(formatDate(null)).toBe("—");
  });

  it("uses India's date even late at night UTC", () => {
    // 20:00 UTC on 12 Oct is 01:30 on 13 Oct in India.
    expect(todayInIndia(new Date("2026-10-12T20:00:00Z"))).toBe("2026-10-13");
  });
});

describe("mobile numbers", () => {
  it("accepts the usual ways of writing an Indian mobile", () => {
    for (const input of ["98450 12345", "098450-12345", "+91 98450 12345", "919845012345"]) {
      expect(normalizeIndianMobile(input)).toBe("+919845012345");
    }
  });

  it("rejects numbers that are not Indian mobiles", () => {
    expect(normalizeIndianMobile("12345")).toBeNull();
    expect(normalizeIndianMobile("5845012345")).toBeNull();
    expect(normalizeIndianMobile("")).toBeNull();
  });

  it("formats for display", () => {
    expect(formatIndianMobile("+919845012345")).toBe("98450 12345");
  });
});
