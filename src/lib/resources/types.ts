import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";
import type { Role, SessionUser } from "@/lib/roles";

export type Row = Record<string, unknown>;

export type ColumnDef = {
  /** Field name; supports dotted paths into included relations, e.g. "assignee.name". */
  key: string;
  label: string;
  sortable?: boolean;
  kind?: "text" | "badge" | "date";
  /** Custom cell renderer for values formatCell cannot handle (e.g. money). */
  render?: (row: Row) => ReactNode;
};

export type FilterDef =
  | { key: string; label: string; type: "text" }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      /** Custom Prisma `where` fragment for the selected value (e.g. relation filters). */
      where?: (value: string, user: SessionUser) => Row;
    }
  | { key: string; label: string; type: "date" }
  /** Renders from/to date inputs (`{key}From` / `{key}To`) filtering a date column. */
  | { key: string; label: string; type: "daterange" };

export type DetailFieldDef = {
  key: string;
  label: string;
  kind?: "text" | "badge" | "date" | "json";
  /** Custom field renderer for values formatCell cannot handle (e.g. money). */
  render?: (row: Row) => ReactNode;
};

export type SummaryFigure = { label: string; value: string };

export type ActionContext = {
  tx: Prisma.TransactionClient;
  user: SessionUser;
  row: Row;
  reason?: string;
  category?: string;
};

export type ActionDef = {
  key: string;
  label: string;
  /** Roles allowed to perform this action. */
  roles: Role[];
  /** When true the dialog requires a free-text reason, stored on the audit row. */
  requiresReason?: boolean;
  /**
   * When set the dialog requires picking a category, validated server-side
   * against the options and recorded on the audit row's reason.
   */
  category?: { label: string; options: { value: string; label: string }[] };
  /** Whether the action is offered for this row. */
  visible?: (row: Row, user: SessionUser) => boolean;
  /** Performs the mutation and returns the updated row (recorded as `after`). */
  execute: (ctx: ActionContext) => Promise<Row>;
};

export type DetailSectionDef = {
  key: string;
  title: string;
  /** Server-rendered below the detail fields; may query the database. */
  render: (row: Row, user: SessionUser) => ReactNode | Promise<ReactNode>;
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
  /** Prisma `include` applied to the list and detail queries (not to action snapshots). */
  include?: Row;
  /**
   * Summary strip rendered above the list. Computed server-side against the
   * same row scope the user sees; no client aggregation.
   */
  summary?: (user: SessionUser) => Promise<SummaryFigure[]>;
  columns: ColumnDef[];
  filters: FilterDef[];
  detailFields: DetailFieldDef[];
  /** Extra sections rendered below the detail fields (e.g. related rows, history). */
  detailSections?: DetailSectionDef[];
  actions: ActionDef[];
  defaultSort: { field: string; dir: "asc" | "desc" };
  /** Secondary sort applied after the active sort, e.g. oldest-first tie-break. */
  sortTiebreak?: { field: string; dir: "asc" | "desc" };
};
