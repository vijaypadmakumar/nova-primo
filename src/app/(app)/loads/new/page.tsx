import { getTranslations } from "next-intl/server";
import { PageHeader, Panel } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { todayInIndia } from "@/lib/format";
import { recentRoutesByShipper } from "@/lib/loads";
import { shipperOptions } from "@/lib/masters";
import { LoadForm } from "../LoadForm";

export default async function NewLoadPage({ searchParams }: { searchParams: Promise<{ shipper?: string }> }) {
  const { shipper } = await searchParams;
  const { office } = await requireOffice();
  const t = await getTranslations("loads");
  const [shippers, routes] = await Promise.all([shipperOptions(office.id), recentRoutesByShipper(office.id)]);
  const preselected = shippers.some((s) => s.id === shipper) ? shipper : undefined;

  return (
    <>
      <PageHeader title={t("newLoad")} subtitle={t("newLoadIntro")} />
      <Panel>
        <LoadForm
          id={null}
          initial={{ loadingDate: todayInIndia(), ...(preselected ? { shipperId: preselected } : {}) }}
          shippers={shippers}
          routes={routes}
          cancelHref="/loads"
        />
      </Panel>
    </>
  );
}
