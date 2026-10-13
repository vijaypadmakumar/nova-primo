import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Panel, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { kgToTonnesInput } from "@/lib/format";
import { getMaster, isMasterKind, ownerOptions } from "@/lib/masters";
import { formatIndianMobile } from "@/lib/phone";
import { MasterForm } from "../../../MasterForm";

/** Stored row → the strings the form shows. */
function toFormValues(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) continue;
    if (k === "phone") out.phone = formatIndianMobile(String(v));
    else if (k === "capacityKg") out.capacity = kgToTonnesInput(Number(v));
    else out[k] = String(v);
  }
  return out;
}

export default async function EditMasterPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!isMasterKind(kind)) notFound();
  const { office } = await requireOffice();
  const row = await getMaster(kind, office.id, id).catch(() => null);
  if (!row) notFound();
  const t = await getTranslations("masters");
  const owners = kind === "drivers" || kind === "vehicles" ? await ownerOptions(office.id) : [];

  return (
    <>
      <PageHeader title={t(`editOne.${kind}`)} />
      <Panel>
        <MasterForm
          kind={kind}
          id={id}
          initial={toFormValues(row)}
          owners={owners}
          cancelHref={`/masters/${kind}/${id}`}
        />
      </Panel>
    </>
  );
}
