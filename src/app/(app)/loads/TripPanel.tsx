import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DOCUMENT_TYPES, TRIP_STATUSES, type Load } from "@/db/schema";
import { SubmitButton } from "@/components/SubmitButton";
import { ButtonLink, Panel } from "@/components/ui";
import { formatDate, formatRupees } from "@/lib/format";
import { driverText } from "@/lib/driverText";
import { formatIndianMobile } from "@/lib/phone";
import type { TripDetail } from "@/lib/trips";
import { ownerPaid, partyPaid, unassignTruck } from "./actions";

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** Truck, driver, progress, papers and money for a load that has a truck. */
export async function TripPanel({ load, trip }: { load: Load; trip: TripDetail }) {
  const t = await getTranslations("trip");
  const tl = await getTranslations("languages");
  const { vehicle, driver, owner } = trip;
  const done = new Map(trip.events.map((e) => [e.status, e.at]));
  const papers = new Map(trip.documents.map((d) => [d.type, d.at]));
  const otherLoads = trip.loads.filter((l) => l.load.id !== load.id);

  const partyTotal = trip.loads.reduce((sum, l) => sum + (l.load.shipperFreightPaise ?? 0), 0);
  const hire = trip.trip.truckFreightPaise ?? 0;
  const advance = trip.trip.advancePaise ?? 0;
  const delivered = load.stage === "delivered" || load.stage === "closed";

  const dt = driverText(driver.language);
  const message = dt.message({
    name: driver.name.split(" ")[0],
    from: load.fromPlace,
    to: load.toPlace,
    date: formatDate(load.loadingDate),
    vehicle: vehicle.number,
    link: "nova.app/t/•••",
  });

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t("truckAndDriver")}</h2>
            <p className="mt-2 text-2xl font-bold tracking-wide">
              <Link href={`/masters/vehicles/${vehicle.id}`} className="text-brand underline-offset-2 hover:underline">
                {vehicle.number}
              </Link>
            </p>
            <p className="text-muted">{owner ? `${owner.name} · ${formatIndianMobile(owner.phone)}` : "—"}</p>
            <p className="mt-2 text-lg font-semibold">
              <Link href={`/masters/drivers/${driver.id}`} className="underline-offset-2 hover:underline">
                {driver.name}
              </Link>
            </p>
            <p className="text-muted">
              {formatIndianMobile(driver.phone)} · {tl(driver.language)}
            </p>
          </div>
          <ButtonLink href={`/driver/${trip.trip.id}`} variant="primary">
            {t("openDriverView")}
          </ButtonLink>
        </div>

        {otherLoads.length > 0 && (
          <div className="mt-4 rounded-lg bg-brand-soft px-4 py-3">
            <p className="font-semibold">{t("sharedTruck")}</p>
            <ul className="mt-1">
              {otherLoads.map((l) => (
                <li key={l.load.id}>
                  <Link href={`/loads/${l.load.id}`} className="text-brand underline">
                    {t("loadOf", { no: l.load.loadNo, party: l.shipperName })}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold text-muted">{t("whatsappPreview")}</p>
          <div className="mt-2 max-w-md rounded-lg rounded-tl-none bg-[#dcf8c6] px-4 py-3 text-[#111b21] shadow-sm" lang={driver.language}>
            {message}
          </div>
          <p className="mt-1 text-sm text-muted">{t("whatsappNote")}</p>
        </div>

        {load.stage === "assigned" && (
          <form action={unassignTruck.bind(null, load.id)} className="mt-5 border-t border-line pt-4">
            <SubmitButton variant="secondary">{t("removeTruck")}</SubmitButton>
          </form>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t("progress")}</h2>
        <ol className="flex flex-col gap-2">
          {TRIP_STATUSES.map((s) => {
            const when = done.get(s);
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    when ? "bg-good text-white" : "border-2 border-line-strong"
                  }`}
                >
                  {when ? "✓" : ""}
                </span>
                <span className={when ? "font-semibold" : "text-muted"}>{t(`status.${s}`)}</span>
                <span className="ml-auto text-sm text-muted">{when ? timeFormat.format(when) : t("waiting")}</span>
              </li>
            );
          })}
        </ol>

        <h3 className="mb-2 mt-5 font-bold">{t("papers")}</h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DOCUMENT_TYPES.map((d) => {
            const when = papers.get(d);
            return (
              <li
                key={d}
                className={`rounded-lg border px-3 py-2 ${when ? "border-good bg-good-soft" : "border-dashed border-line-strong"}`}
              >
                <p className="font-semibold">{t(`doc.${d}`)}</p>
                <p className="text-sm text-muted">{when ? t("receivedAt", { time: timeFormat.format(when) }) : t("notYet")}</p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-bold">{t("money")}</h2>
        <table className="w-full">
          <tbody>
            <MoneyRow label={t("partyFreight", { count: trip.loads.length })} value={formatRupees(partyTotal)} />
            <MoneyRow label={t("truckHire")} value={`− ${formatRupees(hire)}`} />
            <MoneyRow label={t("yourMargin")} value={formatRupees(partyTotal - hire)} strong />
            <MoneyRow label={t("advancePaid")} value={formatRupees(advance)} muted />
            <MoneyRow
              label={t("ownerBalance")}
              value={trip.trip.ownerPaidAt ? t("paid") : formatRupees(hire - advance)}
              muted
            />
            <MoneyRow
              label={t("partyToPay")}
              value={load.partyPaidAt ? t("paid") : formatRupees(load.shipperFreightPaise)}
              muted
            />
          </tbody>
        </table>
        {delivered && (!load.partyPaidAt || !trip.trip.ownerPaidAt) && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
            {!load.partyPaidAt && (
              <form action={partyPaid.bind(null, load.id)}>
                <SubmitButton variant="secondary">{t("markPartyPaid")}</SubmitButton>
              </form>
            )}
            {!trip.trip.ownerPaidAt && (
              <form action={ownerPaid.bind(null, trip.trip.id)}>
                <SubmitButton variant="secondary">{t("markOwnerPaid")}</SubmitButton>
              </form>
            )}
          </div>
        )}
        {!delivered && <p className="mt-3 text-sm text-muted">{t("payAfterDelivery")}</p>}
      </Panel>
    </div>
  );
}

function MoneyRow({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <tr className={`border-b border-line last:border-0 ${strong ? "text-lg font-bold" : ""} ${muted ? "text-muted" : ""}`}>
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 text-right tabular-nums">{value}</td>
    </tr>
  );
}
