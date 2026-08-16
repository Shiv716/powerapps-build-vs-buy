import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { requireRole } from "@/lib/rbac";
import { listRows, parseListParams } from "@/lib/resources/query";
import { getResource } from "@/lib/resources/registry";

type Props = {
  params: { resource: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ResourceListPage({ params, searchParams }: Props) {
  const resource = getResource(params.resource);
  if (!resource) notFound();

  const user = await requireRole(resource.viewRoles, { entityType: resource.model });
  const listParams = parseListParams(resource, searchParams);
  const { rows, total, pageCount } = await listRows(resource, user, listParams);
  const basePath = `/app/${resource.slug}`;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{resource.title}</h1>
      <FilterBar filters={resource.filters} values={listParams.filters} basePath={basePath} />
      <DataTable
        columns={resource.columns}
        rows={rows}
        page={listParams.page}
        pageCount={pageCount}
        total={total}
        sortField={listParams.sortField}
        sortDir={listParams.sortDir}
        basePath={basePath}
        query={{
          ...listParams.filters,
          sort: listParams.sortField,
          dir: listParams.sortDir,
          page: String(listParams.page),
        }}
        rowHref={(row) => `${basePath}/${String(row.id)}`}
      />
    </div>
  );
}
