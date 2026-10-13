"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, SelectInput, TextInput } from "@/components/ui";
import type { FormState } from "@/lib/forms";
import { assignTruck } from "./actions";

export function AssignTruckForm({
  loadId,
  vehicles,
  drivers,
  trips,
}: {
  loadId: string;
  vehicles: { id: string; number: string; ownerName: string | null }[];
  drivers: { id: string; name: string }[];
  trips: { tripId: string; label: string }[];
}) {
  const t = useTranslations("trip");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [state, action] = useActionState(assignTruck.bind(null, loadId), {} as FormState);
  const [mode, setMode] = useState(state.values?.mode ?? "new");
  const v = state.values ?? {};
  const err = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? tv(key) : undefined;
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />
      {trips.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-page p-1" role="radiogroup" aria-label={t("assignHow")}>
          {(["new", "existing"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold ${mode === m ? "bg-panel shadow-sm ring-1 ring-line-strong" : "text-muted"}`}
            >
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>
      )}

      {mode === "new" ? (
        <>
          <Field
            label={t("vehicle")}
            name="vehicleId"
            error={err("vehicleId")}
            required
            hint={
              <Link href="/masters/vehicles/new" className="font-semibold text-brand underline">
                {t("newVehicle")}
              </Link>
            }
          >
            <SelectInput name="vehicleId" defaultValue={v.vehicleId ?? ""} invalid={!!err("vehicleId")} required>
              <option value="">{tc("choose")}</option>
              {vehicles.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.number}
                  {x.ownerName ? ` · ${x.ownerName}` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t("driver")} name="driverId" error={err("driverId")} required>
            <SelectInput name="driverId" defaultValue={v.driverId ?? ""} invalid={!!err("driverId")} required>
              <option value="">{tc("choose")}</option>
              {drivers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("truckHire")} name="truckFreight" error={err("truckFreight")}>
              <TextInput name="truckFreight" inputMode="decimal" placeholder="₹" defaultValue={v.truckFreight} invalid={!!err("truckFreight")} />
            </Field>
            <Field label={t("advance")} name="advance" error={err("advance")}>
              <TextInput name="advance" inputMode="decimal" placeholder="₹" defaultValue={v.advance} invalid={!!err("advance")} />
            </Field>
          </div>
        </>
      ) : (
        <Field label={t("existingTrip")} name="tripId" error={err("tripId")} hint={t("existingTripHint")} required>
          <SelectInput name="tripId" defaultValue={v.tripId ?? ""} invalid={!!err("tripId")} required>
            <option value="">{tc("choose")}</option>
            {trips.map((x) => (
              <option key={x.tripId} value={x.tripId}>
                {x.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      <SubmitButton pendingText={tc("saving")}>{t("fixTruck")}</SubmitButton>
    </form>
  );
}
