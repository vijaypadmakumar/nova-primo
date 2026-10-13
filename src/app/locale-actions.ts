"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale } from "@/i18n/request";

export async function setLocale(formData: FormData) {
  const locale = toLocale(String(formData.get("locale") ?? ""));
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
  });
}
