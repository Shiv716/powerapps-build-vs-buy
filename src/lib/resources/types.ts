import type { Prisma } from "@prisma/client";
import type { Role, SessionUser } from "@/lib/roles";

export type Row = Record<string, unknown>;

export type ColumnDef = {
  key: string;
  label: string;
  sortable?: boolean;
  kind?: "text" | "badge" | "date";
};

export type FilterDef =
  | { key: string; label: string; type: "text" }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "date" };

export type DetailFieldDef = {
  key: string;
  label: string;
  kind?: "text" | "badge" | "date" | "json";
};

export type ActionContext = {
  tx: Prisma.TransactionClient;
  user: SessionUser;
  row: Row;
  reason?: string;
};

export type ActionDef = {
  key: string;
  label: string;
  /** Roles allowed to perform this action. */
  roles: Role[];
  /** When true the dialog requires a free-text reason, stored on the audit row. */
  requiresReason?: boolean;
  /** Whether the action is offered for this row. */
  visible?: (row: Row, user: SessionUser) => boolean;
  /** Performs the mutation and returns the updated row (recorded as `after`). */
  execute: (ctx: ActionContext) => Promise<Row>;
};

export type ResourceConfig = {
  /** URL segment under /app, e.g. "kyc-cases". */
  slug: string;
  title: string;
  /** Prisma model delegate name, e.g. "kycCase" for `prisma.kycCase`. */
  model: string;
  /** Roles allowed to see the list and detail views. */
  viewRoles: Role[];
  /**
   * Row-level scoping: returns a Prisma `where` fragment applied to BOTH the
   * list and detail queries for this user.
   */
  scope?: (user: SessionUser) => Row;
  columns: ColumnDef[];
  filters: FilterDef[];
  detailFields: DetailFieldDef[];
  actions: ActionDef[];
  defaultSort: { field: string; dir: "asc" | "desc" };
};
