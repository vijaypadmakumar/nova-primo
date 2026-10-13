import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoadsTable } from "@/components/LoadsTable";
import { Shortcuts } from "@/components/Shortcuts";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatDate, todayInIndia } from "@/lib/format";
import { listLoads, stageCounts } from "@/lib/loads";

export default async function HomePage() {
  const { user, office } = await requireOffice();
  const t = await getTranslations("home");
  const ts = await getTranslations("stages");
  const today = todayInIndia();

  const [counts, todays, recent] = await Promise.all([
    stageCounts(office.id),
    listLoads(office.id, { loadingDate: today, stages: ["open", "assigned", "in_transit", "delivered", "closed"] }),
    listLoads(office.id, { limit: 5 }),
  ]);

  const tiles = (["open", "assigned", "in_transit", "delivered"] as const).map((stage) => ({
    stage,
    n: counts[stage],
  }));

  return (
    <>
      <Shortcuts createHref="/loads/new" />
      <PageHeader
        title={t("greeting", { name: user.name ?? "" })}
        subtitle={t("today", { date: formatDate(today) })}
        actions={
          <>
            <ButtonLink href="/loads/new" shortcut="Alt+C">
              {t("newLoad")}
            </ButtonLink>
            <ButtonLink href="/masters/shippers/new" variant="secondary">
              {t("newShipper")}
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ stage, n }) => (
          <Link
            key={stage}
            href={`/loads?stage=${stage}`}
            className="rounded-xl border border-line bg-panel p-4 hover:border-brand hover:bg-brand-soft"
          >
            <p className="text-sm font-semibold text-muted">{ts(stage)}</p>
            <p className="mt-1 text-3xl font-bold">{n}</p>
            <p className="mt-1 text-sm text-muted">{t(`tileHint.${stage}`)}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">{t("todaysLoading")}</h2>
        {todays.length ? <LoadsTable loads={todays} /> : <EmptyState title={t("noneToday")} />}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("recent")}</h2>
          <Link href="/loads?stage=all" className="font-semibold text-brand underline">
            {t("seeAll")}
          </Link>
        </div>
        {recent.length ? (
          <LoadsTable loads={recent} />
        ) : (
          <EmptyState title={t("firstLoad")} action={<ButtonLink href="/loads/new">{t("newLoad")}</ButtonLink>} />
        )}
      </section>
    </>
  );
}
