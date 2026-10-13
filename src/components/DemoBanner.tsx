import { getTranslations } from "next-intl/server";
import { resetDemo } from "@/app/demo-actions";

export async function DemoBanner() {
  const t = await getTranslations("demo");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-warn-soft px-4 py-2 text-warn md:px-8">
      <p className="font-semibold">{t("banner")}</p>
      <form action={resetDemo}>
        <button type="submit" className="min-h-10 rounded-md border border-warn px-3 text-sm font-semibold hover:bg-white">
          {t("reset")}
        </button>
      </form>
    </div>
  );
}
