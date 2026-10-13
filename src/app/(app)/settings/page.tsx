import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { formatIndianMobile } from "@/lib/phone";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const { user, office } = await requireOffice();
  const t = await getTranslations("settings");
  const shortcuts = [
    { keys: "Alt+C", what: t("keys.create") },
    { keys: "Ctrl+A", what: t("keys.save") },
    { keys: "Esc", what: t("keys.back") },
  ];

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-4">
        <Panel>
          <h2 className="mb-4 text-xl font-bold">{t("office")}</h2>
          <SettingsForm initial={{ officeName: office.name, city: office.city ?? "", name: user.name ?? "" }} />
          <p className="mt-4 text-muted">{t("signedInPhone", { phone: formatIndianMobile(user.phone) })}</p>
        </Panel>

        <Panel>
          <h2 className="mb-2 text-xl font-bold">{t("language")}</h2>
          <p className="mb-4 text-muted">{t("languageHint")}</p>
          <div className="inline-block">
            <LanguageSwitch />
          </div>
        </Panel>

        <Panel>
          <h2 className="mb-4 text-xl font-bold">{t("shortcuts")}</h2>
          <ul className="flex flex-col gap-3">
            {shortcuts.map((s) => (
              <li key={s.keys} className="flex items-center gap-4">
                <span className="w-24">
                  <kbd className="rounded border border-line-strong bg-page px-2 py-1 font-sans font-semibold">{s.keys}</kbd>
                </span>
                {s.what}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
