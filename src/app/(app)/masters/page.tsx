import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { countMasters, MASTER_KINDS } from "@/lib/masters";

export default async function MastersPage() {
  const { office } = await requireOffice();
  const t = await getTranslations("masters");
  const counts = await countMasters(office.id);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MASTER_KINDS.map((kind) => (
          <div key={kind} className="flex flex-col rounded-xl border border-line bg-panel p-5">
            <Link href={`/masters/${kind}`} className="group flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-bold group-hover:text-brand group-hover:underline">{t(`kinds.${kind}`)}</h2>
              <span className="text-2xl font-bold text-brand">{counts[kind]}</span>
            </Link>
            <p className="mt-1 text-muted">{t(`about.${kind}`)}</p>
            <div className="mt-4 flex gap-4 font-semibold">
              <Link href={`/masters/${kind}`} className="text-brand underline-offset-2 hover:underline">
                {t("display")}
              </Link>
              <Link href={`/masters/${kind}/new`} className="text-brand underline-offset-2 hover:underline">
                {t("create")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
