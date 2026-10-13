import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { kgToTonnesInput, paiseToInput } from "@/lib/format";
import { getLoad, recentRoutesByShipper } from "@/lib/loads";
import { shipperOptions } from "@/lib/masters";
import { LoadForm } from "../../LoadForm";

export default async function EditLoadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { office } = await requireOffice();
  const found = await getLoad(office.id, id).catch(() => null);
  if (!found) notFound();
  const { load } = found;
  if (load.stage !== "open" && load.stage !== "assigned") redirect(`/loads/${id}`);

  const t = await getTranslations("loads");
  const [shippers, routes] = await Promise.all([shipperOptions(office.id), recentRoutesByShipper(office.id)]);

  return (
    <>
      <PageHeader title={`${t("editLoad")} · ${t("loadNo", { no: load.loadNo })}`} />
      <Panel>
        <LoadForm
          id={load.id}
          initial={{
            shipperId: load.shipperId,
            fromPlace: load.fromPlace,
            toPlace: load.toPlace,
            loadingDate: load.loadingDate,
            material: load.material ?? "",
            weight: kgToTonnesInput(load.weightKg),
            truckType: load.truckType ?? "",
            freight: paiseToInput(load.shipperFreightPaise),
            notes: load.notes ?? "",
          }}
          shippers={shippers}
          routes={routes}
          cancelHref={`/loads/${load.id}`}
        />
      </Panel>
    </>
  );
}
