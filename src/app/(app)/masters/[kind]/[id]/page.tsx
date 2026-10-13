import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import type { Driver, Owner, Shipper, Vehicle } from "@/db/schema";
import { LoadsTable } from "@/components/LoadsTable";
import { Shortcuts } from "@/components/Shortcuts";
import { ButtonLink, EmptyState, FactList, PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatTonnes } from "@/lib/format";
import { listLoads } from "@/lib/loads";
import { getMaster, isMasterKind } from "@/lib/masters";
import { formatIndianMobile } from "@/lib/phone";

export default async function MasterDetailPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!isMasterKind(kind)) notFound();
  const { office } = await requireOffice();
  const row = await getMaster(kind, office.id, id).catch(() => null);
  if (!row) notFound();

  const t = await getTranslations("masters");
  const tl = await getTranslations("languages");
  const tt = await getTranslations("truckTypes");
  const ownerName = async (ownerId: string | null) =>
    ownerId ? ((await getMaster("owners", office.id, ownerId)) as Owner | null)?.name ?? "—" : "—";

  let title: string;
  let facts: { label: string; value: React.ReactNode }[];
  let related: React.ReactNode = null;

  switch (kind) {
    case "shippers": {
      const s = row as Shipper;
      title = s.name;
      facts = [
        { label: t("fields.contactPerson"), value: s.contactPerson ?? "—" },
        { label: t("fields.phone"), value: formatIndianMobile(s.phone) },
        { label: t("fields.city"), value: s.city ?? "—" },
        { label: t("fields.gstin"), value: s.gstin ?? "—" },
      ];
      const loads = await listLoads(office.id, { shipperId: s.id });
      related = (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t("shipperLoads", { count: loads.length })}</h2>
            <ButtonLink href={`/loads/new?shipper=${s.id}`} variant="secondary">
              {t("newLoadForShipper")}
            </ButtonLink>
          </div>
          {loads.length ? <LoadsTable loads={loads} hideShipper /> : <EmptyState title={t("noLoadsYet")} />}
        </section>
      );
      break;
    }
    case "owners": {
      const o = row as Owner;
      title = o.name;
      facts = [
        { label: t("fields.phone"), value: formatIndianMobile(o.phone) },
        { label: t("fields.city"), value: o.city ?? "—" },
      ];
      const [drivers, vehicles] = await Promise.all([
        db
          .select()
          .from(schema.drivers)
          .where(and(eq(schema.drivers.ownerId, o.id), eq(schema.drivers.officeId, office.id)))
          .orderBy(asc(schema.drivers.name)),
        db
          .select()
          .from(schema.vehicles)
          .where(and(eq(schema.vehicles.ownerId, o.id), eq(schema.vehicles.officeId, office.id)))
          .orderBy(asc(schema.vehicles.number)),
      ]);
      related = (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel>
            <h2 className="mb-3 text-xl font-bold">{t("kinds.vehicles")}</h2>
            {vehicles.length ? (
              <ul className="flex flex-col gap-2">
                {vehicles.map((v) => (
                  <li key={v.id}>
                    <Link href={`/masters/vehicles/${v.id}`} className="font-semibold text-brand underline">
                      {v.number}
                    </Link>
                    {v.truckType && <span className="text-muted"> · {tt(v.truckType)}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{t("noneYet")}</p>
            )}
          </Panel>
          <Panel>
            <h2 className="mb-3 text-xl font-bold">{t("kinds.drivers")}</h2>
            {drivers.length ? (
              <ul className="flex flex-col gap-2">
                {drivers.map((d) => (
                  <li key={d.id}>
                    <Link href={`/masters/drivers/${d.id}`} className="font-semibold text-brand underline">
                      {d.name}
                    </Link>
                    <span className="text-muted"> · {formatIndianMobile(d.phone)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{t("noneYet")}</p>
            )}
          </Panel>
        </div>
      );
      break;
    }
    case "drivers": {
      const d = row as Driver;
      title = d.name;
      facts = [
        { label: t("fields.phone"), value: formatIndianMobile(d.phone) },
        { label: t("fields.ownerId"), value: await ownerName(d.ownerId) },
        { label: t("fields.language"), value: tl(d.language) },
      ];
      break;
    }
    case "vehicles": {
      const v = row as Vehicle;
      title = v.number;
      facts = [
        { label: t("fields.truckType"), value: v.truckType ? tt(v.truckType) : "—" },
        { label: t("fields.capacity"), value: v.capacityKg != null ? formatTonnes(v.capacityKg) : "—" },
        { label: t("fields.ownerId"), value: await ownerName(v.ownerId) },
      ];
      break;
    }
  }

  if (row.notes) facts.push({ label: t("fields.notes"), value: row.notes });

  return (
    <>
      <Shortcuts backHref={`/masters/${kind}`} />
      <PageHeader
        title={title}
        subtitle={
          <Link href={`/masters/${kind}`} className="text-brand underline">
            {t(`kinds.${kind}`)}
          </Link>
        }
        actions={
          <ButtonLink href={`/masters/${kind}/${id}/edit`} variant="secondary">
            {t("edit")}
          </ButtonLink>
        }
      />
      <Panel>
        <FactList items={facts} />
      </Panel>
      {related}
    </>
  );
}
