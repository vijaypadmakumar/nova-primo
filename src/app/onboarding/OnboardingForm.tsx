"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { createOffice } from "./actions";

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const tv = useTranslations("validation");
  const [state, action] = useActionState(createOffice, {} as FormState);
  const err = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? tv(key) : undefined;
  };

  return (
    <form action={action} className="flex flex-col gap-5" data-main-form>
      <Field label={t("yourName")} name="name" error={err("name")} required>
        <TextInput name="name" autoComplete="name" defaultValue={state.values?.name} invalid={!!err("name")} autoFocus required />
      </Field>
      <Field label={t("officeName")} name="officeName" error={err("officeName")} hint={t("officeNameHint")} required>
        <TextInput name="officeName" autoComplete="organization" defaultValue={state.values?.officeName} invalid={!!err("officeName")} required />
      </Field>
      <Field label={t("city")} name="city" error={err("city")}>
        <TextInput name="city" defaultValue={state.values?.city} invalid={!!err("city")} />
      </Field>
      <SubmitButton pendingText={t("saving")}>{t("start")}</SubmitButton>
    </form>
  );
}
