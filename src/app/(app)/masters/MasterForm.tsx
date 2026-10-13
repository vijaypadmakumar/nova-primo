"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Shortcuts } from "@/components/Shortcuts";
import { SubmitButton } from "@/components/SubmitButton";
import { ButtonLink, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import type { MasterKind } from "@/lib/masters";
import { DRIVER_LANGUAGES, TRUCK_TYPES } from "@/lib/validation";
import { saveMaster } from "./actions";

type FieldDef = {
  name: string;
  type: "text" | "tel" | "number" | "textarea" | "owner" | "language" | "truckType";
  required?: boolean;
  hint?: boolean;
};

const FIELDS: Record<MasterKind, FieldDef[]> = {
  shippers: [
    { name: "name", type: "text", required: true, hint: true },
    { name: "contactPerson", type: "text" },
    { name: "phone", type: "tel" },
    { name: "city", type: "text" },
    { name: "gstin", type: "text", hint: true },
    { name: "notes", type: "textarea" },
  ],
  owners: [
    { name: "name", type: "text", required: true },
    { name: "phone", type: "tel" },
    { name: "city", type: "text" },
    { name: "notes", type: "textarea" },
  ],
  drivers: [
    { name: "name", type: "text", required: true },
    { name: "phone", type: "tel", hint: true },
    { name: "ownerId", type: "owner" },
    { name: "language", type: "language", required: true, hint: true },
    { name: "notes", type: "textarea" },
  ],
  vehicles: [
    { name: "number", type: "text", required: true, hint: true },
    { name: "truckType", type: "truckType" },
    { name: "capacity", type: "number", hint: true },
    { name: "ownerId", type: "owner" },
    { name: "notes", type: "textarea" },
  ],
};

export function MasterForm({
  kind,
  id,
  initial,
  owners = [],
  cancelHref,
  returnTo,
}: {
  kind: MasterKind;
  id: string | null;
  initial: Record<string, string>;
  owners?: { id: string; name: string }[];
  cancelHref: string;
  returnTo?: string;
}) {
  const t = useTranslations("masters");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tl = useTranslations("languages");
  const tt = useTranslations("truckTypes");
  const [state, action] = useActionState(saveMaster.bind(null, kind, id), {} as FormState);
  const values = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-5" data-main-form>
      <Shortcuts backHref={cancelHref} />
      {returnTo && <input type="hidden" name="$returnTo" value={returnTo} />}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {FIELDS[kind].map((f) => {
          const errorKey = state.fieldErrors?.[f.name];
          const error = errorKey ? tv(errorKey) : undefined;
          const common = {
            name: f.name,
            defaultValue: values[f.name] ?? "",
            invalid: !!error,
            required: f.required,
          };
          let control: React.ReactNode;
          switch (f.type) {
            case "textarea":
              control = <TextArea name={f.name} defaultValue={values[f.name] ?? ""} />;
              break;
            case "owner":
              control = (
                <SelectInput {...common}>
                  <option value="">{t("noOwner")}</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </SelectInput>
              );
              break;
            case "language":
              control = (
                <SelectInput {...common} defaultValue={values[f.name] || "hi"}>
                  {DRIVER_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {tl(l)}
                    </option>
                  ))}
                </SelectInput>
              );
              break;
            case "truckType":
              control = (
                <SelectInput {...common}>
                  <option value="">{tc("choose")}</option>
                  {TRUCK_TYPES.map((tt_) => (
                    <option key={tt_} value={tt_}>
                      {tt(tt_)}
                    </option>
                  ))}
                </SelectInput>
              );
              break;
            default:
              control = (
                <TextInput
                  {...common}
                  type={f.type === "tel" ? "tel" : "text"}
                  inputMode={f.type === "tel" || f.type === "number" ? "decimal" : undefined}
                  autoFocus={f.name === FIELDS[kind][0].name}
                  className={f.name === "number" || f.name === "gstin" ? "uppercase" : ""}
                />
              );
          }
          return (
            <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <Field
                label={t(`fields.${f.name}`)}
                name={f.name}
                error={error}
                required={f.required}
                hint={f.hint ? t(`hints.${kind}.${f.name}`) : undefined}
              >
                {control}
              </Field>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <SubmitButton pendingText={tc("saving")} shortcut="Ctrl+A">
          {tc("save")}
        </SubmitButton>
        <ButtonLink href={cancelHref} variant="secondary" shortcut="Esc">
          {tc("cancel")}
        </ButtonLink>
      </div>
    </form>
  );
}
