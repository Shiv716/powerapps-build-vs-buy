import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/roles";
import type { FilterDef, ResourceConfig, Row } from "@/lib/resources/types";

type ModelDelegate = {
  findMany(args: Record<string, unknown>): Promise<Row[]>;
  findFirst(args: Record<string, unknown>): Promise<Row | null>;
  count(args: Record<string, unknown>): Promise<number>;
};

export function delegateFor(model: string, client?: Prisma.TransactionClient): ModelDelegate {
  const source = (client ?? prisma) as unknown as Record<string, ModelDelegate>;
  const delegate = source[model];
  if (!delegate) throw new Error(`Unknown Prisma model delegate: ${model}`);
  return delegate;
}

export const PAGE_SIZE = 20;

export type ListParams = {
  page: number;
  sortField: string;
  sortDir: "asc" | "desc";
  filters: Record<string, string>;
};

export function parseListParams(
  resource: ResourceConfig,
  searchParams: Record<string, string | string[] | undefined>,
): ListParams {
  const single = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Math.max(1, Number(single("page")) || 1);
  const sortField =
    resource.columns.find((c) => c.sortable && c.key === single("sort"))?.key ??
    resource.defaultSort.field;
  const sortDir = single("dir") === "asc" ? "asc" : single("dir") === "desc" ? "desc" : resource.defaultSort.dir;
  const filters: Record<string, string> = {};
  for (const filter of resource.filters) {
    if (filter.type === "daterange") {
      for (const key of [`${filter.key}From`, `${filter.key}To`]) {
        const value = single(key);
        if (value) filters[key] = value;
      }
      continue;
    }
    const value = single(filter.key);
    if (value) filters[filter.key] = value;
  }
  return { page, sortField, sortDir, filters };
}

function parseDay(value: string | undefined): Date | null {
  if (!value) return null;
  const day = new Date(value);
  return Number.isNaN(day.getTime()) ? null : day;
}

function filterWhere(
  filters: FilterDef[],
  values: Record<string, string>,
  user: SessionUser,
): Row {
  const fragments: Row[] = [];
  for (const filter of filters) {
    if (filter.type === "daterange") {
      const from = parseDay(values[`${filter.key}From`]);
      const to = parseDay(values[`${filter.key}To`]);
      const range: Row = {};
      if (from) range.gte = from;
      if (to) {
        const next = new Date(to);
        next.setDate(next.getDate() + 1);
        range.lt = next;
      }
      if (from || to) fragments.push({ [filter.key]: range });
      continue;
    }
    const value = values[filter.key];
    if (!value) continue;
    if (filter.type === "text") {
      fragments.push({ [filter.key]: { contains: value, mode: "insensitive" } });
    } else if (filter.type === "select") {
      fragments.push(filter.where ? filter.where(value, user) : { [filter.key]: value });
    } else {
      const day = parseDay(value);
      if (day) {
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        fragments.push({ [filter.key]: { gte: day, lt: next } });
      }
    }
  }
  return { AND: fragments };
}

/** Combines row-level scope with user filters. Scope applies to every query. */
function scopedWhere(resource: ResourceConfig, user: SessionUser, extra: Row = {}): Row {
  const scope = resource.scope?.(user) ?? {};
  return { AND: [scope, extra] };
}

export async function listRows(
  resource: ResourceConfig,
  user: SessionUser,
  params: ListParams,
): Promise<{ rows: Row[]; total: number; pageCount: number }> {
  const delegate = delegateFor(resource.model);
  const where = scopedWhere(resource, user, filterWhere(resource.filters, params.filters, user));
  const orderBy: Row[] = [{ [params.sortField]: params.sortDir }];
  if (resource.sortTiebreak && resource.sortTiebreak.field !== params.sortField) {
    orderBy.push({ [resource.sortTiebreak.field]: resource.sortTiebreak.dir });
  }
  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      include: resource.include,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    delegate.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getRow(
  resource: ResourceConfig,
  user: SessionUser,
  id: string,
  client?: Prisma.TransactionClient,
  options: { include?: boolean } = {},
): Promise<Row | null> {
  const delegate = delegateFor(resource.model, client);
  return delegate.findFirst({
    where: scopedWhere(resource, user, { id }),
    include: options.include === false ? undefined : resource.include,
  });
}
