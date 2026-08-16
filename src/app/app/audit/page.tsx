import type { Prisma } from "@prisma/client";
import { DataTable } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
// eslint-disable-next-line no-restricted-imports -- read-only admin view of the audit table itself
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { PAGE_SIZE } from "@/lib/resources/query";
import type { FilterDef, Row } from "@/lib/resources/types";

const FILTERS: FilterDef[] = [
  { key: "actorEmail", label: "Actor", type: "text" },
  { key: "entityType", label: "Entity type", type: "text" },
  { key: "entityId", label: "Entity id", type: "text" },
  { key: "createdAt", label: "Date", type: "date" },
];

type SearchParams = Record<string, string | string[] | undefined>;

function single(searchParams: SearchParams, key: string): string {
  const value = searchParams[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["admin"], { entityType: "auditLog" });

  const page = Math.max(1, Number(single(searchParams, "page")) || 1);
  const values: Record<string, string> = {};
  for (const filter of FILTERS) {
    const value = single(searchParams, filter.key);
    if (value) values[filter.key] = value;
  }

  const where: Prisma.AuditLogWhereInput = {};
  if (values.actorEmail) where.actorEmail = { contains: values.actorEmail, mode: "insensitive" };
  if (values.entityType) where.entityType = { contains: values.entityType, mode: "insensitive" };
  if (values.entityId) where.entityId = values.entityId;
  if (values.createdAt) {
    const day = new Date(values.createdAt);
    if (!Number.isNaN(day.getTime())) {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: day, lt: next };
    }
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Audit log</h1>
      <FilterBar filters={FILTERS} values={values} basePath="/app/audit" />
      <DataTable
        columns={[
          { key: "createdAt", label: "When", kind: "date" },
          { key: "actorEmail", label: "Actor" },
          { key: "action", label: "Action", kind: "badge" },
          { key: "entityType", label: "Entity type" },
          { key: "entityId", label: "Entity id" },
          { key: "reason", label: "Reason" },
          { key: "ip", label: "IP" },
        ]}
        rows={rows as unknown as Row[]}
        page={page}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        sortField="createdAt"
        sortDir="desc"
        basePath="/app/audit"
        query={{ ...values, page: String(page) }}
      />
    </div>
  );
}
