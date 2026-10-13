"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSession, requireOffice } from "@/lib/auth/session";
import { createDemoOffice, resetDemoOffice } from "@/lib/demo";

/** Opens a fresh sandbox office full of sample data. No phone number or SMS needed. */
export async function startDemo() {
  const t = await getTranslations("demo");
  const { userId } = await createDemoOffice(t("agentName"));
  await createSession(userId);
  redirect("/");
}

export async function resetDemo() {
  const { office } = await requireOffice();
  if (!office.isDemo) return;
  await resetDemoOffice(office.id);
  revalidatePath("/", "layout");
  redirect("/?reset=1");
}
