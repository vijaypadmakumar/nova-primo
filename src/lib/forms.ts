import type { ZodError } from "zod";

/** What a server action hands back to its form when something needs fixing. */
export type FormState = {
  /** An error for the whole form (message key). */
  error?: string;
  /** A non-error message for the whole form (message key). */
  notice?: string;
  /** Message keys per field (translated on the client). */
  fieldErrors?: Record<string, string>;
  /** What the person typed, so nothing is lost after an error. */
  values?: Record<string, string>;
};

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

/** First error message per field, keyed by field name. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Trimmed text or null, for optional text columns. */
export function optionalText(value: string | undefined | null): string | null {
  const t = (value ?? "").trim();
  return t === "" ? null : t;
}
