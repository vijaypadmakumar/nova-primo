import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SearchBox } from "@/components/SearchBox";
import { Shortcuts } from "@/components/Shortcuts";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatTonnes } from "@/lib/format";
import { isMasterKind, listDrivers, listOwners, listShippers, listVehicles } from "@/lib/masters";
import { formatIndianMobile } from "@/lib/phone";

type Row = { id: string; cells: React.ReactNode[] };

export default async function MasterListPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { kind } = await params;
  if (!isMasterKind(kind)) notFound();
  const { q } = await searchParams;
  const { office } = await requireOffice();
  const t = await getTranslations("masters");
  const tl = await getTranslations("languages");
  const tt = await getTranslations("truckTypes");

  let headers: string[];
  let rows: Row[];
  switch (kind) {
    case "shippers":
      headers = [t("fields.name"), t("fields.city"), t("fields.contactPerson"), t("fields.phone")];
      rows = (await listShippers(office.id, q)).map((s) => ({
        id: s.id,
        cells: [s.name, s.city ?? "—", s.contactPerson ?? "—", formatIndianMobile(s.phone)],
      }));
      break;
    case "owners":
      headers = [t("fields.name"), t("fields.city"), t("fields.phone")];
      rows = (await listOwners(office.id, q)).map((o) => ({
        id: o.id,
        cells: [o.name, o.city ?? "—", formatIndianMobile(o.phone)],
      }));
      break;
    case "drivers":
      headers = [t("fields.name"), t("fields.phone"), t("fields.ownerId"), t("fields.language")];
      rows = (await listDrivers(office.id, q)).map(({ driver, ownerName }) => ({
        id: driver.id,
        cells: [driver.name, formatIndianMobile(driver.phone), ownerName ?? "—", tl(driver.language)],
      }));
      break;
    case "vehicles":
      headers = [t("fields.number"), t("fields.truckType"), t("fields.capacity"), t("fields.ownerId")];
      rows = (await listVehicles(office.id, q)).map(({ vehicle, ownerName }) => ({
        id: vehicle.id,
        cells: [
          vehicle.number,
          vehicle.truckType ? tt(vehicle.truckType) : "—",
          vehicle.capacityKg != null ? formatTonnes(vehicle.capacityKg) : "—",
          ownerName ?? "—",
        ],
      }));
      break;
  }

  return (
    <>
      <Shortcuts createHref={`/masters/${kind}/new`} backHref="/masters" />
      <PageHeader
        title={t(`kinds.${kind}`)}
        subtitle={
          <Link href="/masters" className="text-brand underline">
            {t("title")}
          </Link>
        }
        actions={
          <ButtonLink href={`/masters/${kind}/new`} shortcut="Alt+C">
            {t(`createOne.${kind}`)}
          </ButtonLink>
        }
      />
      <div className="mb-4">
        <SearchBox q={q} placeholder={t("searchPlaceholder")} />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={q ? t("noMatch") : t(`empty.${kind}`)}
          action={!q && <ButtonLink href={`/masters/${kind}/new`}>{t(`createOne.${kind}`)}</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-left">
            <thead className="border-b border-line-strong bg-brand-soft text-sm">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 even:bg-page/60 hover:bg-brand-soft/60">
                  {r.cells.map((c, i) => (
                    <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold" : ""}`}>
                      {i === 0 ? (
                        <Link href={`/masters/${kind}/${r.id}`} className="text-brand underline-offset-2 hover:underline">
                          {c}
                        </Link>
                      ) : (
                        c
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
