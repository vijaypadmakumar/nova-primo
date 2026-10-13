/** Indian-style money and quantity helpers. Amounts are stored in paise. */

const rupeeFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return rupeeFormat.format(Math.round(paise / 100));
}

/**
 * Parse what an agent types for an amount ("45000", "45,000", "₹ 45,000.50")
 * into paise. Returns null for an empty field and NaN for something unreadable.
 */
export function parseRupeesToPaise(input: string | null | undefined): number | null {
  const cleaned = (input ?? "").replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100);
}

/** Tonnes as typed ("9", "9.5") to kilograms. Null when empty, NaN when unreadable. */
export function parseTonnesToKg(input: string | null | undefined): number | null {
  const cleaned = (input ?? "").replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 1000);
}

export function formatTonnes(kg: number | null | undefined): string {
  if (kg == null) return "—";
  return `${Number((kg / 1000).toFixed(2))} t`;
}

/** Plain value for an edit form: paise → "45000". */
export function paiseToInput(paise: number | null | undefined): string {
  if (paise == null) return "";
  const r = paise / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export function kgToTonnesInput(kg: number | null | undefined): string {
  if (kg == null) return "";
  return String(kg / 1000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-13" → "13-Oct-2026", the date style Tally users read every day. */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  const month = MONTHS[Number(m) - 1];
  if (!y || !month || !d) return isoDate;
  return `${d}-${month}-${y}`;
}

/** Today's date in India as YYYY-MM-DD, whatever the server's time zone. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
