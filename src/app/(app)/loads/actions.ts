"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DOCUMENT_TYPES, TRIP_STATUSES, type DocumentType, type TripStatus } from "@/db/schema";
import { requireOffice } from "@/lib/auth/session";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import { parseRupeesToPaise } from "@/lib/format";
import { createLoad, getLoad, setLoadStage, shipperExists, updateLoad } from "@/lib/loads";
import {
  addDocument,
  addLoadToTrip,
  belongsToOffice,
  createTripForLoad,
  markOwnerPaid,
  markPartyPaid,
  recordStatus,
  removeTruck,
} from "@/lib/trips";
import { loadSchema } from "@/lib/validation";

export async function saveLoad(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const { office, user } = await requireOffice();
  const values = formValues(formData);
  const parsed = loadSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  if (!(await shipperExists(office.id, parsed.data.shipperId))) {
    return { fieldErrors: { shipperId: "chooseShipper" }, values };
  }

  let loadId = id;
  if (id) await updateLoad(office.id, id, parsed.data);
  else loadId = (await createLoad(office.id, user.id, parsed.data)).id;

  revalidatePath("/", "layout");
  redirect(`/loads/${loadId}${id ? "" : "?created=1"}`);
}

/** Cancel an open load, or bring a cancelled one back to Open. */
export async function toggleCancelled(id: string) {
  const { office } = await requireOffice();
  const found = await getLoad(office.id, id);
  if (!found) return;
  const { stage } = found.load;
  if (stage === "open") await setLoadStage(office.id, id, "cancelled");
  else if (stage === "cancelled") await setLoadStage(office.id, id, "open");
  revalidatePath("/", "layout");
}

const assignSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("new"),
    vehicleId: z.string().uuid("chooseVehicle"),
    driverId: z.string().uuid("chooseDriver"),
    truckFreight: z
      .string()
      .optional()
      .transform((v, ctx) => {
        const p = parseRupeesToPaise(v);
        if (Number.isNaN(p)) {
          ctx.addIssue({ code: "custom", message: "invalidAmount" });
          return z.NEVER;
        }
        return p;
      }),
    advance: z
      .string()
      .optional()
      .transform((v, ctx) => {
        const p = parseRupeesToPaise(v);
        if (Number.isNaN(p)) {
          ctx.addIssue({ code: "custom", message: "invalidAmount" });
          return z.NEVER;
        }
        return p;
      }),
  }),
  z.object({ mode: z.literal("existing"), tripId: z.string().uuid("chooseTrip") }),
]);

/** Fix a truck for an open load: a new trip, or a truck already fixed for another load. */
export async function assignTruck(loadId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { office } = await requireOffice();
  const values = formValues(formData);
  const parsed = assignSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  const input = parsed.data;

  if (input.mode === "new") {
    if (!(await belongsToOffice("vehicles", input.vehicleId, office.id))) return { fieldErrors: { vehicleId: "chooseVehicle" }, values };
    if (!(await belongsToOffice("drivers", input.driverId, office.id))) return { fieldErrors: { driverId: "chooseDriver" }, values };
    if (input.advance !== null && input.truckFreight !== null && input.advance > input.truckFreight) {
      return { fieldErrors: { advance: "advanceTooHigh" }, values };
    }
    await createTripForLoad(office.id, loadId, {
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      truckFreightPaise: input.truckFreight,
      advancePaise: input.advance,
    });
  } else {
    if (!(await belongsToOffice("trips", input.tripId, office.id))) return { fieldErrors: { tripId: "chooseTrip" }, values };
    await addLoadToTrip(office.id, loadId, input.tripId);
  }
  revalidatePath("/", "layout");
  redirect(`/loads/${loadId}?assigned=1`);
}

export async function unassignTruck(loadId: string) {
  const { office } = await requireOffice();
  await removeTruck(office.id, loadId);
  revalidatePath("/", "layout");
}

export async function partyPaid(loadId: string) {
  const { office } = await requireOffice();
  await markPartyPaid(office.id, loadId);
  revalidatePath("/", "layout");
}

export async function ownerPaid(tripId: string) {
  const { office } = await requireOffice();
  await markOwnerPaid(office.id, tripId);
  revalidatePath("/", "layout");
}

/** A tap on the driver's page (simulated in the demo). */
export async function driverStatus(tripId: string, status: TripStatus) {
  if (!(TRIP_STATUSES as readonly string[]).includes(status)) return;
  const { office } = await requireOffice();
  await recordStatus(office.id, tripId, status);
  revalidatePath("/", "layout");
}

export async function driverDocument(tripId: string, type: DocumentType) {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(type)) return;
  const { office } = await requireOffice();
  await addDocument(office.id, tripId, type);
  revalidatePath("/", "layout");
}
