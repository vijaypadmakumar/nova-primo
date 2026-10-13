import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { LoadStage } from "@/db/schema";
import { formatDate, formatRupees, formatTonnes } from "@/lib/format";
import type { LoadRow } from "@/lib/loads";

const stageTone: Record<LoadStage, string> = {
  open: "bg-warn-soft text-warn",
  assigned: "bg-brand-soft text-brand-dark",
  in_transit: "bg-brand-soft text-brand-dark",
  delivered: "bg-good-soft text-good",
  closed: "bg-page text-muted",
  cancelled: "bg-bad-soft text-bad",
};

export async function StageBadge({ stage }: { stage: LoadStage }) {
  const t = await getTranslations("stages");
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${stageTone[stage]}`}>
      {t(stage)}
    </span>
  );
}

/** Loads as a ruled register on desktop and as cards on a phone. */
export async function LoadsTable({ loads, hideShipper = false }: { loads: LoadRow[]; hideShipper?: boolean }) {
  const t = await getTranslations("loads");
  const tt = await getTranslations("truckTypes");

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-panel md:block">
        <table className="w-full text-left">
          <thead className="border-b border-line-strong bg-brand-soft text-sm">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.no")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.date")}</th>
              {!hideShipper && <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.shipper")}</th>}
              <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.route")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.goods")}</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">{t("col.freight")}</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("col.stage")}</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 even:bg-page/60 hover:bg-brand-soft/60">
                <td className="px-4 py-3">
                  <Link href={`/loads/${l.id}`} className="font-bold text-brand underline-offset-2 hover:underline">
                    {l.loadNo}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(l.loadingDate)}</td>
                {!hideShipper && <td className="px-4 py-3 font-medium">{l.shipperName}</td>}
                <td className="px-4 py-3">
                  {l.fromPlace} → {l.toPlace}
                </td>
                <td className="px-4 py-3 text-muted">
                  {[l.material, l.weightKg != null ? formatTonnes(l.weightKg) : null, l.truckType ? tt(l.truckType) : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatRupees(l.shipperFreightPaise)}</td>
                <td className="px-4 py-3">
                  <StageBadge stage={l.stage} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {loads.map((l) => (
          <li key={l.id}>
            <Link href={`/loads/${l.id}`} className="block rounded-xl border border-line bg-panel p-4 active:bg-brand-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">
                    {t("loadNo", { no: l.loadNo })} · {formatDate(l.loadingDate)}
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {l.fromPlace} → {l.toPlace}
                  </p>
                  {!hideShipper && <p className="font-medium">{l.shipperName}</p>}
                </div>
                <StageBadge stage={l.stage} />
              </div>
              <p className="mt-2 text-muted">
                {[l.material, l.weightKg != null ? formatTonnes(l.weightKg) : null, formatRupees(l.shipperFreightPaise)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
