"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Shortcuts } from "@/components/Shortcuts";
import { SubmitButton } from "@/components/SubmitButton";
import { ButtonLink, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import type { SavedRoute } from "@/lib/loads";
import { TRUCK_TYPES } from "@/lib/validation";
import { saveLoad } from "./actions";

export function LoadForm({
  id,
  initial,
  shippers,
  routes,
  cancelHref,
}: {
  id: string | null;
  initial: Record<string, string>;
  shippers: { id: string; name: string; city: string | null }[];
  routes: Record<string, SavedRoute[]>;
  cancelHref: string;
}) {
  const t = useTranslations("loads");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tt = useTranslations("truckTypes");
  const [state, action] = useActionState(saveLoad.bind(null, id), {} as FormState);
  const start = state.values ?? initial;

  // Fields a saved route can fill are controlled; the rest stay plain inputs.
  const [shipperId, setShipperId] = useState(start.shipperId ?? "");
  const [fromPlace, setFromPlace] = useState(start.fromPlace ?? "");
  const [toPlace, setToPlace] = useState(start.toPlace ?? "");
  const [material, setMaterial] = useState(start.material ?? "");
  const [truckType, setTruckType] = useState(start.truckType ?? "");

  const err = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? tv(key) : undefined;
  };
  const savedRoutes = routes[shipperId] ?? [];

  function applyRoute(r: SavedRoute) {
    setFromPlace(r.fromPlace);
    setToPlace(r.toPlace);
    if (r.material) setMaterial(r.material);
    if (r.truckType) setTruckType(r.truckType);
  }

  return (
    <form action={action} className="flex flex-col gap-6" data-main-form>
      <Shortcuts backHref={cancelHref} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-lg font-bold">{t("section.party")}</legend>
        <Field
          label={t("fields.shipper")}
          name="shipperId"
          error={err("shipperId")}
          required
          hint={
            <Link href="/masters/shippers/new?from=new-load" className="font-semibold text-brand underline">
              {t("newShipper")}
            </Link>
          }
        >
          <SelectInput
            name="shipperId"
            value={shipperId}
            onChange={(e) => setShipperId(e.target.value)}
            invalid={!!err("shipperId")}
            required
            autoFocus={!id}
          >
            <option value="">{t("chooseShipper")}</option>
            {shippers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.city ? ` (${s.city})` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>

        {savedRoutes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">{t("savedRoutes")}</p>
            <div className="flex flex-wrap gap-2">
              {savedRoutes.map((r) => (
                <button
                  key={`${r.fromPlace}-${r.toPlace}`}
                  type="button"
                  onClick={() => applyRoute(r)}
                  className="min-h-11 rounded-full border border-brand bg-brand-soft px-4 font-medium text-brand-dark hover:bg-brand hover:text-white"
                >
                  {r.fromPlace} → {r.toPlace}
                </button>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">{t("section.route")}</legend>
        <Field label={t("fields.fromPlace")} name="fromPlace" error={err("fromPlace")} required>
          <TextInput name="fromPlace" value={fromPlace} onChange={(e) => setFromPlace(e.target.value)} invalid={!!err("fromPlace")} required />
        </Field>
        <Field label={t("fields.toPlace")} name="toPlace" error={err("toPlace")} required>
          <TextInput name="toPlace" value={toPlace} onChange={(e) => setToPlace(e.target.value)} invalid={!!err("toPlace")} required />
        </Field>
        <Field label={t("fields.loadingDate")} name="loadingDate" error={err("loadingDate")} required>
          <TextInput name="loadingDate" type="date" defaultValue={start.loadingDate} invalid={!!err("loadingDate")} required />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">{t("section.goods")}</legend>
        <Field label={t("fields.material")} name="material" error={err("material")}>
          <TextInput name="material" value={material} onChange={(e) => setMaterial(e.target.value)} invalid={!!err("material")} />
        </Field>
        <Field label={t("fields.weight")} name="weight" error={err("weight")} hint={t("hints.weight")}>
          <TextInput name="weight" inputMode="decimal" defaultValue={start.weight} invalid={!!err("weight")} />
        </Field>
        <Field label={t("fields.truckType")} name="truckType" error={err("truckType")}>
          <SelectInput name="truckType" value={truckType} onChange={(e) => setTruckType(e.target.value)} invalid={!!err("truckType")}>
            <option value="">{tc("choose")}</option>
            {TRUCK_TYPES.map((k) => (
              <option key={k} value={k}>
                {tt(k)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">{t("section.money")}</legend>
        <Field label={t("fields.freight")} name="freight" error={err("freight")} hint={t("hints.freight")}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">₹</span>
            <TextInput name="freight" inputMode="decimal" defaultValue={start.freight} invalid={!!err("freight")} className="pl-8" />
          </div>
        </Field>
        <div className="md:col-span-2">
          <Field label={t("fields.notes")} name="notes" error={err("notes")}>
            <TextArea name="notes" defaultValue={start.notes} />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <SubmitButton pendingText={tc("saving")} shortcut="Ctrl+A">
          {id ? tc("save") : t("saveLoad")}
        </SubmitButton>
        <ButtonLink href={cancelHref} variant="secondary" shortcut="Esc">
          {tc("cancel")}
        </ButtonLink>
      </div>
    </form>
  );
}
