import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoadsTable } from "@/components/LoadsTable";
import { Shortcuts } from "@/components/Shortcuts";
import { ButtonLink, EmptyState, Notice, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatDate, formatRupees, todayInIndia } from "@/lib/format";
import { moneySummary } from "@/lib/insights";
import { listLoads, stageCounts } from "@/lib/loads";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  const { user, office } = await requireOffice();
  const t = await getTranslations("home");
  const ts = await getTranslations("stages");
  const today = todayInIndia();

  const [counts, todays, recent, money] = await Promise.all([
    stageCounts(office.id),
    listLoads(office.id, { loadingDate: today, stages: ["open", "assigned", "in_transit", "delivered", "closed"] }),
    listLoads(office.id, { limit: 5 }),
    moneySummary(office.id),
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

      {reset && (
        <div className="mb-4">
          <Notice tone="good">{t("resetDone")}</Notice>
        </div>
      )}

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
        <h2 className="mb-3 text-xl font-bold">{t("moneyTitle")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-sm font-semibold text-muted">{t("money.freight")}</p>
            <p className="mt-1 text-2xl font-bold">{formatRupees(money.freight)}</p>
            <p className="mt-1 text-sm text-muted">{t("money.hire", { amount: formatRupees(money.hire) })}</p>
          </div>
          <div className="rounded-xl border border-good bg-good-soft p-4">
            <p className="text-sm font-semibold text-good">{t("money.margin")}</p>
            <p className="mt-1 text-2xl font-bold text-good">{formatRupees(money.margin)}</p>
            <p className="mt-1 text-sm text-muted">{t("money.marginHint")}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-sm font-semibold text-muted">{t("money.toCollect")}</p>
            <p className="mt-1 text-2xl font-bold text-warn">{formatRupees(money.toCollect)}</p>
            <p className="mt-1 text-sm text-muted">{t("money.toPay", { amount: formatRupees(money.toPay) })}</p>
          </div>
        </div>
        {money.podMissing > 0 && (
          <p className="mt-3 rounded-lg bg-warn-soft px-4 py-3 font-semibold text-warn">
            {t("podMissing", { count: money.podMissing })}
          </p>
        )}
      </section>

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
