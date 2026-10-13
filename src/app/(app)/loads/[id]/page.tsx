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
import { joinableTrips, getTrip, vehicleAndDriverOptions } from "@/lib/trips";
import { toggleCancelled } from "../actions";
import { AssignTruckForm } from "../AssignTruckForm";
import { TripPanel } from "../TripPanel";

export default async function LoadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; assigned?: string }>;
}) {
  const { id } = await params;
  const { created, assigned } = await searchParams;
  const { office } = await requireOffice();
  const found = await getLoad(office.id, id).catch(() => null);
  if (!found) notFound();
  const { load, shipperName, shipperPhone } = found;

  const t = await getTranslations("loads");
  const ttrip = await getTranslations("trip");
  const trip = load.tripId ? await getTrip(office.id, load.tripId) : null;
  const options = load.stage === "open" ? await vehicleAndDriverOptions(office.id) : null;
  const trips = load.stage === "open" ? await joinableTrips(office.id) : [];
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

      {(created || assigned) && (
        <div className="mb-4">
          <Notice tone="good">{created ? t("created", { no: load.loadNo }) : ttrip("assignedNotice")}</Notice>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel>
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

        {trip ? (
          <TripPanel load={load} trip={trip} />
        ) : (
          <Panel>
            <h2 className="mb-1 text-lg font-bold">{ttrip("fixTruckTitle")}</h2>
            {options ? (
              <>
                <p className="mb-4 text-muted">{ttrip("fixTruckIntro")}</p>
                <AssignTruckForm loadId={load.id} vehicles={options.vehicles} drivers={options.drivers} trips={trips} />
              </>
            ) : (
              <p className="text-muted">{ttrip("noTruckCancelled")}</p>
            )}
            {(load.stage === "open" || load.stage === "cancelled") && (
              <form action={toggleCancelled.bind(null, load.id)} className="mt-6 border-t border-line pt-4">
                <SubmitButton variant={load.stage === "open" ? "danger" : "secondary"}>
                  {load.stage === "open" ? t("cancelLoad") : t("reopenLoad")}
                </SubmitButton>
              </form>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
