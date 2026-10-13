"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireOffice } from "@/lib/auth/session";
import { fieldErrorsFrom, formValues, optionalText, type FormState } from "@/lib/forms";

const settingsSchema = z.object({
  officeName: z.string().trim().min(1, "required").max(120, "tooLong"),
  city: z.string().max(80, "tooLong").optional(),
  name: z.string().trim().min(1, "required").max(80, "tooLong"),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, office } = await requireOffice();
  const values = formValues(formData);
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  await db
    .update(schema.offices)
    .set({ name: parsed.data.officeName, city: optionalText(parsed.data.city) })
    .where(eq(schema.offices.id, office.id));
  await db.update(schema.users).set({ name: parsed.data.name }).where(eq(schema.users.id, user.id));

  revalidatePath("/", "layout");
  return { notice: "saved" };
}
