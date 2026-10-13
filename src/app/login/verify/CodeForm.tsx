"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { checkCode, resendCode } from "../actions";

export function CodeForm() {
  const t = useTranslations("login");
  const [state, action] = useActionState(checkCode, {} as FormState);
  const [resendState, resend] = useActionState(resendCode, {} as FormState);
  const codeError = state.fieldErrors?.code;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5" data-main-form>
        <Field label={t("codeLabel")} name="code" error={codeError && t(`errors.${codeError}`)}>
          <TextInput
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="______"
            className="tracking-[0.5em]"
            invalid={!!codeError}
            autoFocus
            required
          />
        </Field>
        <SubmitButton pendingText={t("checking")}>{t("signIn")}</SubmitButton>
      </form>
      <form action={resend} className="flex flex-col gap-3">
        {resendState.notice && <Notice tone="good">{t(`notices.${resendState.notice}`)}</Notice>}
        {resendState.error && <Notice tone="bad">{t(`errors.${resendState.error}`)}</Notice>}
        <SubmitButton variant="secondary" pendingText={t("sending")}>
          {t("resend")}
        </SubmitButton>
      </form>
    </div>
  );
}
