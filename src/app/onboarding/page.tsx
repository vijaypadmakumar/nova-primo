import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth/session";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.officeId) redirect("/");
  const t = await getTranslations("onboarding");
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("intro")}</p>
      <div className="mt-6">
        <OnboardingForm />
      </div>
    </AuthShell>
  );
}
