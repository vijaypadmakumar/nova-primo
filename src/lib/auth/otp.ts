import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_GAP_MS = 30 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_PER_HOUR = 5;

export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashCode(phone: string, code: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(`${secret}:${phone}:${code}`).digest("hex");
}

export function codesMatch(expectedHash: string, phone: string, code: string): boolean {
  const a = Buffer.from(expectedHash, "hex");
  const b = Buffer.from(hashCode(phone, code), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "too_soon" | "too_many" };

/** Create a fresh code for a phone, respecting the resend gap and hourly cap. */
export async function issueCode(phone: string, now = new Date()): Promise<IssueResult> {
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recent = await db
    .select({ createdAt: schema.otpCodes.createdAt })
    .from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.phone, phone), gt(schema.otpCodes.createdAt, hourAgo)))
    .orderBy(desc(schema.otpCodes.createdAt));

  if (recent.length >= OTP_MAX_PER_HOUR) return { ok: false, reason: "too_many" };
  if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < OTP_RESEND_GAP_MS) {
    return { ok: false, reason: "too_soon" };
  }

  const code = generateCode();
  await db.insert(schema.otpCodes).values({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
  });
  return { ok: true, code };
}

export type VerifyResult = { ok: true } | { ok: false; reason: "expired" | "wrong" | "locked" };

/** Check a typed code against the latest live code for that phone. */
export async function verifyCode(phone: string, code: string, now = new Date()): Promise<VerifyResult> {
  const [latest] = await db
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.phone, phone),
        isNull(schema.otpCodes.consumedAt),
        gt(schema.otpCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);

  if (!latest) return { ok: false, reason: "expired" };
  if (latest.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  if (!/^\d{6}$/.test(code) || !codesMatch(latest.codeHash, phone, code)) {
    await db
      .update(schema.otpCodes)
      .set({ attempts: latest.attempts + 1 })
      .where(eq(schema.otpCodes.id, latest.id));
    return { ok: false, reason: latest.attempts + 1 >= OTP_MAX_ATTEMPTS ? "locked" : "wrong" };
  }

  await db
    .update(schema.otpCodes)
    .set({ consumedAt: now })
    .where(eq(schema.otpCodes.id, latest.id));
  return { ok: true };
}
