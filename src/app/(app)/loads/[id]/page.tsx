import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { StageBadge } from "@/components/LoadsTable";
import { Shortcuts } from "@/components/Shortcuts";
import { SubmitButton } from "@/components/SubmitButton";
import { ButtonLink, FactList, Notice, PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatDate, formatRupees, formatTonnes } from "@/lib/format";
import { getLoad } from "@/lib/loads";
import { formatIndianMobile } from "@/lib/phone";
import { toggleCancelled } from "../actions";

export default async function LoadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const { office } = await requireOffice();
  const found = await getLoad(office.id, id).catch(() => null);
  if (!found) notFound();
  const { load, shipperName, shipperPhone } = found;

  const t = await getTranslations("loads");
  const tt = await getTranslations("truckTypes");
  const canEdit = load.stage === "open" || load.stage === "assigned";

  return (
    <>
      <Shortcuts backHref="/loads" />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t("loadNo", { no: load.loadNo })}
            <StageBadge stage={load.stage} />
          </span>
        }
        subtitle={
          <Link href="/loads" className="text-brand underline">
            {t("title")}
          </Link>
        }
        actions={
          canEdit && (
            <ButtonLink href={`/loads/${load.id}/edit`} variant="secondary">
              {t("editLoad")}
            </ButtonLink>
          )
        }
      />

      {created && (
        <div className="mb-4">
          <Notice tone="good">{t("created", { no: load.loadNo })}</Notice>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <p className="text-2xl font-bold">
            {load.fromPlace} → {load.toPlace}
          </p>
          <p className="mb-5 mt-1 text-muted">{t("loadingOn", { date: formatDate(load.loadingDate) })}</p>
          <FactList
            items={[
              {
                label: t("fields.shipper"),
                value: (
                  <Link href={`/masters/shippers/${load.shipperId}`} className="text-brand underline">
                    {shipperName}
                  </Link>
                ),
              },
              { label: t("shipperPhone"), value: formatIndianMobile(shipperPhone) },
              { label: t("fields.material"), value: load.material ?? "—" },
              { label: t("fields.weight"), value: formatTonnes(load.weightKg) },
              { label: t("fields.truckType"), value: load.truckType ? tt(load.truckType) : "—" },
              { label: t("fields.freight"), value: formatRupees(load.shipperFreightPaise) },
              ...(load.notes ? [{ label: t("fields.notes"), value: load.notes }] : []),
            ]}
          />
        </Panel>

        <Panel>
          <h2 className="text-lg font-bold">{t("truckTitle")}</h2>
          <p className="mt-2 text-muted">{t("truckComingSoon")}</p>
          {(load.stage === "open" || load.stage === "cancelled") && (
            <form action={toggleCancelled.bind(null, load.id)} className="mt-6 border-t border-line pt-4">
              <SubmitButton variant={load.stage === "open" ? "danger" : "secondary"}>
                {load.stage === "open" ? t("cancelLoad") : t("reopenLoad")}
              </SubmitButton>
            </form>
          )}
        </Panel>
      </div>
    </>
  );
}
