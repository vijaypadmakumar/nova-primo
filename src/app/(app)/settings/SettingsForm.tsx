"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Shortcuts } from "@/components/Shortcuts";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { saveSettings } from "./actions";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [state, action] = useActionState(saveSettings, {} as FormState);
  const values = state.values ?? initial;
  const err = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? tv(key) : undefined;
  };

  return (
    <form action={action} className="flex flex-col gap-5" data-main-form>
      <Shortcuts backHref="/" />
      {state.notice && <Notice tone="good">{t("saved")}</Notice>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label={t("officeName")} name="officeName" error={err("officeName")} required>
          <TextInput name="officeName" defaultValue={values.officeName} invalid={!!err("officeName")} required />
        </Field>
        <Field label={t("city")} name="city" error={err("city")}>
          <TextInput name="city" defaultValue={values.city} invalid={!!err("city")} />
        </Field>
        <Field label={t("yourName")} name="name" error={err("name")} required>
          <TextInput name="name" defaultValue={values.name} invalid={!!err("name")} required />
        </Field>
      </div>
      <div className="border-t border-line pt-5">
        <SubmitButton pendingText={tc("saving")} shortcut="Ctrl+A">
          {tc("save")}
        </SubmitButton>
      </div>
    </form>
  );
}
