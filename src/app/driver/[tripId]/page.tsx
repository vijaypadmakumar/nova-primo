import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DOCUMENT_TYPES, TRIP_STATUSES } from "@/db/schema";
import { driverDocument, driverStatus } from "@/app/(app)/loads/actions";
import { requireOffice } from "@/lib/auth/session";
import { driverText, hasDriverText } from "@/lib/driverText";
import { formatDate } from "@/lib/format";
import { formatIndianMobile } from "@/lib/phone";
import { getTrip } from "@/lib/trips";

const timeFormat = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

/**
 * What the driver would see after opening the WhatsApp link. In the demo the
 * agent opens it here, inside a phone frame, and can tap through the trip.
 */
export default async function DriverViewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { office } = await requireOffice();
  const trip = await getTrip(office.id, tripId).catch(() => null);
  if (!trip) notFound();

  const t = await getTranslations("demo");
  const tl = await getTranslations("languages");
  const { driver, vehicle, loads } = trip;
  const d = driverText(driver.language);
  const done = new Map(trip.events.map((e) => [e.status, e.at]));
  const sent = new Set(trip.documents.map((x) => x.type));
  const next = TRIP_STATUSES.find((s) => !done.has(s));
  const firstLoad = loads[0]?.load;

  return (
    <main className="min-h-screen bg-page px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <div className="rounded-lg bg-warn-soft px-4 py-3 text-warn">
          <p className="font-semibold">{t("driverViewTitle")}</p>
          <p className="text-sm">
            {t("driverViewNote", { language: tl(driver.language) })}
            {!hasDriverText(driver.language) && ` ${t("driverViewFallback")}`}
          </p>
        </div>
        {firstLoad && (
          <Link href={`/loads/${firstLoad.id}`} className="font-semibold text-brand underline">
            ← {t("backToLoad")}
          </Link>
        )}

        <div className="overflow-hidden rounded-[2rem] border-[10px] border-ink bg-white shadow-xl" lang={driver.language}>
          <div className="bg-brand px-5 py-4 text-white">
            <p className="text-sm opacity-90">{office.name}</p>
            <p className="text-2xl font-bold">{d.greeting(driver.name.split(" ")[0])}</p>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <section>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">{d.yourTrip}</p>
              <p className="mt-1 text-lg">
                {d.truck}: <strong className="tracking-wide">{vehicle.number}</strong>
              </p>
              {loads.map(({ load, shipperName, shipperPhone }) => (
                <div key={load.id} className="mt-3 rounded-xl border border-line p-4">
                  <p className="text-sm text-muted">{d.pickup}</p>
                  <p className="text-xl font-bold">{load.fromPlace}</p>
                  <p className="mt-2 text-sm text-muted">{d.drop}</p>
                  <p className="text-xl font-bold">{load.toPlace}</p>
                  <p className="mt-2 text-muted">
                    {load.material} · {formatDate(load.loadingDate)}
                  </p>
                  <p className="mt-1 font-medium">{shipperName}</p>
                  {shipperPhone && (
                    <a href={`tel:${shipperPhone}`} className="mt-2 inline-block font-semibold text-brand underline">
                      {d.callParty}: {formatIndianMobile(shipperPhone)}
                    </a>
                  )}
                </div>
              ))}
            </section>

            <section>
              <p className="mb-2 font-semibold">{d.tapWhen}</p>
              <div className="flex flex-col gap-2">
                {TRIP_STATUSES.map((s) => {
                  const when = done.get(s);
                  if (when) {
                    return (
                      <div key={s} className="flex min-h-14 items-center gap-3 rounded-xl bg-good-soft px-4 text-good">
                        <span aria-hidden className="text-xl">✓</span>
                        <span className="font-semibold">{d.status[s]}</span>
                        <span className="ml-auto text-sm">{timeFormat.format(when)}</span>
                      </div>
                    );
                  }
                  const isNext = s === next;
                  return (
                    <form key={s} action={driverStatus.bind(null, trip.trip.id, s)}>
                      <button
                        type="submit"
                        disabled={!isNext}
                        className={`min-h-14 w-full rounded-xl px-4 text-left text-lg font-bold ${
                          isNext ? "bg-brand text-white" : "border border-line bg-page text-muted"
                        }`}
                      >
                        {d.status[s]}
                      </button>
                    </form>
                  );
                })}
              </div>
              {!next && <p className="mt-3 text-center text-lg font-bold text-good">{d.done}</p>}
            </section>

            <section>
              <p className="mb-2 font-semibold">{d.photos}</p>
              <div className="grid grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map((doc) =>
                  sent.has(doc) ? (
                    <div key={doc} className="flex min-h-20 flex-col items-center justify-center rounded-xl bg-good-soft p-2 text-center text-good">
                      <span aria-hidden className="text-xl">✓</span>
                      <span className="text-sm font-semibold">{d.doc[doc]}</span>
                    </div>
                  ) : (
                    <form key={doc} action={driverDocument.bind(null, trip.trip.id, doc)}>
                      <button
                        type="submit"
                        className="flex min-h-20 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand p-2 text-center text-brand"
                      >
                        <span aria-hidden className="text-xl">📷</span>
                        <span className="text-sm font-semibold">{d.doc[doc]}</span>
                      </button>
                    </form>
                  ),
                )}
              </div>
            </section>

            <a href="tel:" className="block rounded-xl border border-line py-3 text-center font-semibold text-brand">
              {d.callAgent}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
