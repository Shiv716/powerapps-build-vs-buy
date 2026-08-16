import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionDialog } from "@/components/action-dialog";
import { DetailPanel } from "@/components/detail-panel";
import { hasRole, requireRole } from "@/lib/rbac";
import { getRow } from "@/lib/resources/query";
import { getResource } from "@/lib/resources/registry";

type Props = {
  params: { resource: string; id: string };
};

export default async function ResourceDetailPage({ params }: Props) {
  const resource = getResource(params.resource);
  if (!resource) notFound();

  const user = await requireRole(resource.viewRoles, {
    entityType: resource.model,
    entityId: params.id,
  });

  const row = await getRow(resource, user, params.id);
  if (!row) notFound();

  const availableActions = resource.actions.filter(
    (action) =>
      hasRole(user, action.roles) && (!action.visible || action.visible(row, user)),
  );

  const sections = await Promise.all(
    (resource.detailSections ?? []).map(async (section) => ({
      key: section.key,
      title: section.title,
      content: await section.render(row, user),
    })),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href={`/app/${resource.slug}`} className="text-sm text-slate-500 hover:underline">
            ← {resource.title}
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">{params.id}</h1>
        </div>
        <div className="flex gap-2">
          {availableActions.map((action) => (
            <ActionDialog
              key={action.key}
              resourceSlug={resource.slug}
              rowId={params.id}
              actionKey={action.key}
              label={action.label}
              requiresReason={Boolean(action.requiresReason)}
              category={action.category}
            />
          ))}
        </div>
      </div>
      <DetailPanel fields={resource.detailFields} row={row} />
      {sections.map((section) => (
        <section key={section.key} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {section.title}
          </h2>
          {section.content}
        </section>
      ))}
    </div>
  );
}
