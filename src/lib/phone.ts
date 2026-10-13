/**
 * Normalise an Indian mobile number to +91XXXXXXXXXX.
 * Accepts "98450 12345", "098450-12345", "+91 98450 12345", "919845012345".
 * Returns null when it is not a valid Indian mobile number.
 */
export function normalizeIndianMobile(input: string | null | undefined): string | null {
  let digits = (input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** +919845012345 → "98450 12345" for display. */
export function formatIndianMobile(phone: string | null | undefined): string {
  if (!phone) return "—";
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `${m[1]} ${m[2]}` : phone;
}
