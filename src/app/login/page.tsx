import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { startDemo } from "@/app/demo-actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/auth/session";
import { PhoneForm } from "./PhoneForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const t = await getTranslations("login");
  const td = await getTranslations("demo");
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">{td("title")}</h1>
      <p className="mt-2 text-muted">{td("intro")}</p>
      <form action={startDemo} className="mt-6 flex flex-col">
        <SubmitButton pendingText={td("opening")}>{td("start")}</SubmitButton>
      </form>

      <details className="mt-8 border-t border-line pt-5">
        <summary className="cursor-pointer font-semibold text-brand">{t("title")}</summary>
        <p className="mt-2 text-muted">{t("intro")}</p>
        <div className="mt-4">
          <PhoneForm />
        </div>
      </details>
    </AuthShell>
  );
}
