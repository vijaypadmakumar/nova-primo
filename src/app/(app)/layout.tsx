import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/login/actions";
import { BookIcon, GearIcon, HomeIcon, TruckIcon } from "@/components/icons";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { BottomNav, SideNav, type NavItem } from "@/components/NavLinks";
import { requireOffice } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, office } = await requireOffice();
  const t = await getTranslations("nav");

  const items: NavItem[] = [
    { href: "/", label: t("home"), icon: <HomeIcon /> },
    { href: "/loads", label: t("loads"), icon: <TruckIcon /> },
    { href: "/masters", label: t("masters"), icon: <BookIcon /> },
    { href: "/settings", label: t("settings"), icon: <GearIcon /> },
  ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-panel p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t("appName")}</p>
          <p className="mt-1 text-lg font-bold leading-snug">{office.name}</p>
        </div>
        <SideNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3 md:px-8">
          <p className="truncate font-bold md:hidden">{office.name}</p>
          <p className="hidden text-muted md:block">{t("signedInAs", { name: user.name ?? "" })}</p>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <form action={signOut}>
              <button type="submit" className="min-h-10 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-muted hover:bg-brand-soft hover:text-ink">
                {t("signOut")}
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
