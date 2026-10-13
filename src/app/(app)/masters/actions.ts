"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOffice } from "@/lib/auth/session";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import {
  insertMaster,
  isMasterKind,
  masterRow,
  masterSchemas,
  ownerBelongsToOffice,
  updateMaster,
} from "@/lib/masters";

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** Create (id null) or edit one master. Bound to kind and id by the form. */
export async function saveMaster(
  kind: string,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isMasterKind(kind)) throw new Error("Unknown master");
  const { office } = await requireOffice();
  const values = formValues(formData);

  const parsed = masterSchemas[kind].safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const data = parsed.data as Record<string, unknown>;
  if (typeof data.ownerId === "string" && !(await ownerBelongsToOffice(data.ownerId, office.id))) {
    return { fieldErrors: { ownerId: "invalidChoice" }, values };
  }

  const row = masterRow(kind, data);
  let savedId = id;
  try {
    if (id) await updateMaster(kind, office.id, id, row);
    else savedId = await insertMaster(kind, office.id, row);
  } catch (err) {
    if (kind === "vehicles" && isUniqueViolation(err)) {
      return { fieldErrors: { number: "duplicateVehicle" }, values };
    }
    throw err;
  }

  revalidatePath("/masters", "layout");
  // A shipper created from the new-load screen goes straight back to it.
  const returnTo = String(formData.get("$returnTo") ?? "");
  if (kind === "shippers" && returnTo === "new-load") redirect(`/loads/new?shipper=${savedId}`);
  redirect(`/masters/${kind}/${savedId}`);
}
