"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { fieldErrorsFrom, formValues, optionalText, type FormState } from "@/lib/forms";

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "required").max(80, "tooLong"),
  officeName: z.string().trim().min(1, "required").max(120, "tooLong"),
  city: z.string().trim().max(80, "tooLong").optional(),
});

export async function createOffice(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.officeId) redirect("/");

  const values = formValues(formData);
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  await db.transaction(async (tx) => {
    const [office] = await tx
      .insert(schema.offices)
      .values({ name: parsed.data.officeName, city: optionalText(parsed.data.city) })
      .returning({ id: schema.offices.id });
    await tx
      .update(schema.users)
      .set({ name: parsed.data.name, officeId: office.id })
      .where(eq(schema.users.id, user.id));
  });
  redirect("/");
}
