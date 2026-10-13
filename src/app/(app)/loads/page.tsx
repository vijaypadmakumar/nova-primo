import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { LoadStage } from "@/db/schema";
import { LoadsTable } from "@/components/LoadsTable";
import { SearchBox } from "@/components/SearchBox";
import { Shortcuts } from "@/components/Shortcuts";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { BOARD_STAGES, listLoads, stageCounts } from "@/lib/loads";

const TABS = ["active", ...BOARD_STAGES, "cancelled", "all"] as const;
type Tab = (typeof TABS)[number];

function stagesFor(tab: Tab): LoadStage[] | undefined {
  if (tab === "all") return undefined;
  if (tab === "active") return ["open", "assigned", "in_transit", "delivered"];
  return [tab];
}

export default async function LoadsPage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const { stage, q } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(stage ?? "") ? (stage as Tab) : "active";
  const { office } = await requireOffice();
  const t = await getTranslations("loads");
  const ts = await getTranslations("stages");

  const [counts, loads] = await Promise.all([
    stageCounts(office.id),
    listLoads(office.id, { stages: stagesFor(tab), q }),
  ]);
  const tabCount = (tb: Tab) =>
    tb === "all"
      ? Object.values(counts).reduce((a, b) => a + b, 0)
      : (stagesFor(tb) ?? []).reduce((a, s) => a + counts[s], 0);

  return (
    <>
      <Shortcuts createHref="/loads/new" backHref="/" />
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ButtonLink href="/loads/new" shortcut="Alt+C">
            {t("newLoad")}
          </ButtonLink>
        }
      />

      <nav aria-label={t("stageFilter")} className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tb) => {
          const active = tb === tab;
          const params = new URLSearchParams({ stage: tb, ...(q ? { q } : {}) });
          return (
            <Link
              key={tb}
              href={`/loads?${params}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 font-semibold ${
                active ? "border-brand bg-brand text-white" : "border-line-strong bg-panel text-ink hover:bg-brand-soft"
              }`}
            >
              {tb === "active" || tb === "all" ? t(`tabs.${tb}`) : ts(tb)}
              <span className={`rounded-full px-2 text-sm ${active ? "bg-white/20" : "bg-page"}`}>{tabCount(tb)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-4">
        <SearchBox q={q} placeholder={t("searchPlaceholder")} hidden={{ stage: tab }} />
      </div>

      {loads.length ? (
        <LoadsTable loads={loads} />
      ) : (
        <EmptyState
          title={q ? t("noMatch") : t("empty")}
          action={!q && <ButtonLink href="/loads/new">{t("newLoad")}</ButtonLink>}
        />
      )}
    </>
  );
}
