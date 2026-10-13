"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { requestCode } from "./actions";

export function PhoneForm() {
  const t = useTranslations("login");
  const [state, action] = useActionState(requestCode, {} as FormState);
  const phoneError = state.fieldErrors?.phone;

  return (
    <form action={action} className="flex flex-col gap-5" data-main-form>
      {state.error && <Notice tone="bad">{t(`errors.${state.error}`)}</Notice>}
      <Field label={t("phoneLabel")} name="phone" error={phoneError && t(`errors.${phoneError}`)} hint={t("phoneHint")}>
        <TextInput
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98450 12345"
          defaultValue={state.values?.phone}
          invalid={!!phoneError}
          autoFocus
          required
        />
      </Field>
      <SubmitButton pendingText={t("sending")}>{t("sendCode")}</SubmitButton>
    </form>
  );
}
