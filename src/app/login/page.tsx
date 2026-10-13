import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth/session";
import { PhoneForm } from "./PhoneForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const t = await getTranslations("login");
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("intro")}</p>
      <div className="mt-6">
        <PhoneForm />
      </div>
    </AuthShell>
  );
}
