import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "./LanguageSwitch";

export async function AuthShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <span className="text-xl font-bold text-brand">{t("appName")}</span>
        <LanguageSwitch />
      </div>
      <div className="mt-10 w-full max-w-md rounded-xl border border-line bg-panel p-6 md:p-8">
        {children}
      </div>
    </main>
  );
}
