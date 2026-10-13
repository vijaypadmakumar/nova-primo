"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOffice } from "@/lib/auth/session";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import { createLoad, getLoad, setLoadStage, shipperExists, updateLoad } from "@/lib/loads";
import { loadSchema } from "@/lib/validation";

export async function saveLoad(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { office, user } = await requireOffice();
  const values = formValues(formData);
  const parsed = loadSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  if (!(await shipperExists(office.id, parsed.data.shipperId))) {
    return { fieldErrors: { shipperId: "chooseShipper" }, values };
  }

  let loadId = id;
  if (id) await updateLoad(office.id, id, parsed.data);
  else loadId = (await createLoad(office.id, user.id, parsed.data)).id;

  revalidatePath("/", "layout");
  redirect(`/loads/${loadId}${id ? "" : "?created=1"}`);
}

/** Cancel an open load, or bring a cancelled one back to Open. */
export async function toggleCancelled(id: string) {
  const { office } = await requireOffice();
  const found = await getLoad(office.id, id);
  if (!found) return;
  const { stage } = found.load;
  if (stage === "open") await setLoadStage(office.id, id, "cancelled");
  else if (stage === "cancelled") await setLoadStage(office.id, id, "open");
  revalidatePath("/", "layout");
}
