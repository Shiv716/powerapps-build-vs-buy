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
  const [{ rows, total, pageCount }, summary] = await Promise.all([
    listRows(resource, user, listParams),
    resource.summary?.(user) ?? Promise.resolve(null),
  ]);
  const basePath = `/app/${resource.slug}`;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{resource.title}</h1>
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map((figure) => (
            <div key={figure.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                {figure.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                {figure.value}
              </p>
            </div>
          ))}
        </div>
      )}
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
