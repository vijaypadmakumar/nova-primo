import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui";
import { isOtpDevMode } from "@/lib/auth/sms";
import { formatIndianMobile } from "@/lib/phone";
import { CodeForm } from "./CodeForm";

export default async function VerifyPage() {
  const jar = await cookies();
  const phone = jar.get("nova_login_phone")?.value;
  if (!phone) redirect("/login");
  const devCode = isOtpDevMode() ? jar.get("nova_dev_code")?.value : undefined;
  const t = await getTranslations("login");

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold">{t("verifyTitle")}</h1>
      <p className="mt-2 text-muted">
        {t("verifyIntro", { phone: formatIndianMobile(phone) })}{" "}
        <Link href="/login" className="font-semibold text-brand underline">
          {t("changeNumber")}
        </Link>
      </p>
      {devCode && (
        <div className="mt-4">
          <Notice>
            {t("testModeCode")} <strong className="text-xl tracking-widest" data-testid="dev-code">{devCode}</strong>
          </Notice>
        </div>
      )}
      <div className="mt-6">
        <CodeForm />
      </div>
    </AuthShell>
  );
}
