import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Panel, PageHeader } from "@/components/ui";
import { requireOffice } from "@/lib/auth/session";
import { isMasterKind, ownerOptions } from "@/lib/masters";
import { MasterForm } from "../../MasterForm";

export default async function NewMasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { kind } = await params;
  if (!isMasterKind(kind)) notFound();
  const { from } = await searchParams;
  const { office } = await requireOffice();
  const t = await getTranslations("masters");
  const owners = kind === "drivers" || kind === "vehicles" ? await ownerOptions(office.id) : [];
  const fromNewLoad = kind === "shippers" && from === "new-load";

  return (
    <>
      <PageHeader title={t(`createOne.${kind}`)} />
      <Panel>
        <MasterForm
          kind={kind}
          id={null}
          initial={{}}
          owners={owners}
          cancelHref={fromNewLoad ? "/loads/new" : `/masters/${kind}`}
          returnTo={fromNewLoad ? "new-load" : undefined}
        />
      </Panel>
    </>
  );
}
