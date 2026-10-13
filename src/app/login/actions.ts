"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { issueCode, verifyCode } from "@/lib/auth/otp";
import { createSession, destroySession } from "@/lib/auth/session";
import { isOtpDevMode, sendSignInCode } from "@/lib/auth/sms";
import type { FormState } from "@/lib/forms";
import { normalizeIndianMobile } from "@/lib/phone";

const PHONE_COOKIE = "nova_login_phone";
const DEV_CODE_COOKIE = "nova_dev_code";
const shortCookie = { httpOnly: true, sameSite: "lax" as const, path: "/login", maxAge: 15 * 60 };

async function startSignIn(phone: string): Promise<FormState | null> {
  const issued = await issueCode(phone);
  if (!issued.ok) return { error: issued.reason === "too_soon" ? "tooSoon" : "tooMany" };
  try {
    await sendSignInCode(phone, issued.code);
  } catch {
    return { error: "smsFailed" };
  }
  const jar = await cookies();
  jar.set(PHONE_COOKIE, phone, shortCookie);
  if (isOtpDevMode()) jar.set(DEV_CODE_COOKIE, issued.code, shortCookie);
  return null;
}

export async function requestCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = String(formData.get("phone") ?? "");
  const phone = normalizeIndianMobile(raw);
  if (!phone) return { fieldErrors: { phone: "invalidPhone" }, values: { phone: raw } };
  const failed = await startSignIn(phone);
  if (failed) return { ...failed, values: { phone: raw } };
  redirect("/login/verify");
}

export async function resendCode(): Promise<FormState> {
  const phone = (await cookies()).get(PHONE_COOKIE)?.value;
  if (!phone) redirect("/login");
  return (await startSignIn(phone)) ?? { notice: "resent" };
}

export async function checkCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const jar = await cookies();
  const phone = jar.get(PHONE_COOKIE)?.value;
  if (!phone) redirect("/login");

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const result = await verifyCode(phone, code);
  if (!result.ok) return { fieldErrors: { code: `code_${result.reason}` } };

  let [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (!user) [user] = await db.insert(schema.users).values({ phone }).returning();

  await createSession(user.id);
  jar.delete({ name: PHONE_COOKIE, path: "/login" });
  jar.delete({ name: DEV_CODE_COOKIE, path: "/login" });
  redirect(user.officeId ? "/" : "/onboarding");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
