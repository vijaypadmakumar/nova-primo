import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatRupees } from "@/lib/format";
import { connections, type DriverLink, type PartyLink } from "@/lib/insights";

const VIEWS = ["map", "parties", "drivers"] as const;
type View = (typeof VIEWS)[number];

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: raw } = await searchParams;
  const view: View = (VIEWS as readonly string[]).includes(raw ?? "") ? (raw as View) : "map";
  const { office } = await requireOffice();
  const t = await getTranslations("connections");
  const data = await connections(office.id);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <nav aria-label={t("title")} className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/connections?view=${v}`}
            aria-current={v === view ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-full border px-4 font-semibold ${
              v === view ? "border-brand bg-brand text-white" : "border-line-strong bg-panel hover:bg-brand-soft"
            }`}
          >
            {t(`views.${v}`)}
          </Link>
        ))}
      </nav>

      {data.parties.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : view === "map" ? (
        <NetworkMap parties={data.parties} drivers={data.drivers} pairs={data.pairs} />
      ) : view === "parties" ? (
        <PartyTable rows={data.parties} />
      ) : (
        <DriverTable rows={data.drivers} />
      )}
    </>
  );
}

async function NetworkMap({
  parties,
  drivers,
  pairs,
}: {
  parties: PartyLink[];
  drivers: DriverLink[];
  pairs: { partyId: string; driverId: string; loads: number }[];
}) {
  const t = await getTranslations("connections");
  const rowH = 64;
  const top = 56;
  const height = top + Math.max(parties.length, drivers.length, 1) * rowH;
  const leftX = 230;
  const rightX = 530;
  const py = (i: number) => top + i * rowH + rowH / 2 - 8;
  const partyIndex = new Map(parties.map((p, i) => [p.id, i]));
  const driverIndex = new Map(drivers.map((d, i) => [d.id, i]));

  return (
    <Panel>
      <p className="mb-3 text-muted">{t("mapIntro")}</p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 760 ${height}`} className="min-w-[640px]" role="img" aria-label={t("mapIntro")}>
          <text x={leftX} y={28} textAnchor="end" className="fill-muted text-[14px] font-semibold">
            {t("partiesHeading")}
          </text>
          <text x={rightX} y={28} className="fill-muted text-[14px] font-semibold">
            {t("driversHeading")}
          </text>
          {pairs.map((p) => {
            const a = partyIndex.get(p.partyId);
            const b = driverIndex.get(p.driverId);
            if (a === undefined || b === undefined) return null;
            const y1 = py(a);
            const y2 = py(b);
            return (
              <path
                key={`${p.partyId}-${p.driverId}`}
                d={`M${leftX + 12} ${y1} C ${(leftX + rightX) / 2} ${y1}, ${(leftX + rightX) / 2} ${y2}, ${rightX - 12} ${y2}`}
                fill="none"
                stroke="var(--color-brand)"
                strokeOpacity={0.55}
                strokeWidth={1.5 + p.loads * 2.5}
              >
                <title>{t("pairTitle", { count: p.loads })}</title>
              </path>
            );
          })}
          {parties.map((p, i) => (
            <g key={p.id}>
              <circle cx={leftX} cy={py(i)} r={9} fill="var(--color-brand)" />
              <text x={leftX - 18} y={py(i) - 2} textAnchor="end" className="fill-ink text-[15px] font-semibold">
                {p.name}
              </text>
              <text x={leftX - 18} y={py(i) + 16} textAnchor="end" className="fill-muted text-[13px]">
                {t("loadsCount", { count: p.loads })}
              </text>
            </g>
          ))}
          {drivers.map((d, i) => (
            <g key={d.id}>
              <circle cx={rightX} cy={py(i)} r={9} fill="var(--color-good)" />
              <text x={rightX + 18} y={py(i) - 2} className="fill-ink text-[15px] font-semibold">
                {d.name}
              </text>
              <text x={rightX + 18} y={py(i) + 16} className="fill-muted text-[13px]">
                {d.vehicles.join(", ")}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-3 text-sm text-muted">{t("mapNote")}</p>
    </Panel>
  );
}

async function PartyTable({ rows }: { rows: PartyLink[] }) {
  const t = await getTranslations("connections");
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full text-left">
        <thead className="border-b border-line-strong bg-brand-soft text-sm">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">{t("col.party")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.loads")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.running")}</th>
            <th className="whitespace-nowrap px-4 py-3">{t("col.driversUsed")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.freight")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.toCollect")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0 even:bg-page/60">
              <td className="px-4 py-3 font-semibold">
                <Link href={`/masters/shippers/${r.id}`} className="text-brand underline-offset-2 hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right">{r.loads}</td>
              <td className="px-4 py-3 text-right">{r.running}</td>
              <td className="px-4 py-3 text-muted">{r.drivers.join(", ") || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupees(r.freight)}</td>
              <td className={`whitespace-nowrap px-4 py-3 text-right ${r.toCollect ? "font-semibold text-warn" : ""}`}>
                {formatRupees(r.toCollect)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function DriverTable({ rows }: { rows: DriverLink[] }) {
  const t = await getTranslations("connections");
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full text-left">
        <thead className="border-b border-line-strong bg-brand-soft text-sm">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">{t("col.driver")}</th>
            <th className="whitespace-nowrap px-4 py-3">{t("col.owner")}</th>
            <th className="whitespace-nowrap px-4 py-3">{t("col.vehicles")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.loads")}</th>
            <th className="whitespace-nowrap px-4 py-3 text-right">{t("col.running")}</th>
            <th className="whitespace-nowrap px-4 py-3">{t("col.partiesServed")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0 even:bg-page/60">
              <td className="px-4 py-3 font-semibold">
                <Link href={`/masters/drivers/${r.id}`} className="text-brand underline-offset-2 hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="px-4 py-3">{r.ownerName ?? "—"}</td>
              <td className="px-4 py-3">{r.vehicles.join(", ")}</td>
              <td className="px-4 py-3 text-right">{r.loads}</td>
              <td className="px-4 py-3 text-right">{r.running}</td>
              <td className="px-4 py-3 text-muted">{r.parties.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
