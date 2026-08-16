import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import type { SessionUser } from "@/lib/roles";
import { ValidationError } from "@/lib/resources/actions";
import type { ActionContext, ResourceConfig, Row, SummaryFigure } from "@/lib/resources/types";
import { formatCell } from "@/components/format";

/** Refunds at or below this amount need one approval; above it, two. */
export const SINGLE_APPROVAL_LIMIT = new Prisma.Decimal(500);

const OPEN_STATUSES = ["pending", "awaiting_second_approval"] as const;

export function formatMoney(amount: unknown, currency: unknown): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: String(currency ?? "GBP"),
  }).format(Number(amount));
}

function moneyCell(row: Row): string {
  return formatMoney(row.amount, row.currency);
}

const REASON_LABELS: Record<string, string> = {
  duplicate: "Duplicate charge",
  fraud: "Fraud",
  service_failure: "Service failure",
  goodwill: "Goodwill",
};

/** Scalar fields worth surfacing when diffing audit before/after snapshots. */
const TRACKED_FIELDS = ["status", "firstApproverId", "secondApproverId", "decidedAt"] as const;

function changedFields(before: unknown, after: unknown): { field: string; from: string; to: string }[] {
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return [];
  const b = before as Row;
  const a = after as Row;
  return TRACKED_FIELDS.filter((field) => JSON.stringify(b[field]) !== JSON.stringify(a[field])).map(
    (field) => ({
      field,
      from: b[field] == null ? "—" : String(b[field]),
      to: a[field] == null ? "—" : String(a[field]),
    }),
  );
}

async function HistorySection({ refundId }: { refundId: string }) {
  const entries = await prisma.auditLog.findMany({
    where: { entityType: "refundRequest", entityId: refundId },
    orderBy: { createdAt: "asc" },
  });
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No history recorded for this refund.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-slate-900">{entry.action}</span>
            <span className="text-xs text-slate-500">
              {formatCell(entry.createdAt, "date")} · {entry.actorEmail}
            </span>
          </div>
          {changedFields(entry.before, entry.after).map((change) => (
            <p key={change.field} className="mt-1 text-xs text-slate-600">
              <span className="font-medium">{change.field}</span>: {change.from} → {change.to}
            </p>
          ))}
          {entry.reason && (
            <p className="mt-2 border-l-2 border-slate-200 pl-2 text-sm italic text-slate-600">
              {entry.reason}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function actionable(row: Row): boolean {
  return (OPEN_STATUSES as readonly string[]).includes(String(row.status));
}

function transition(ctx: ActionContext, data: Record<string, unknown>): Promise<Row> {
  return ctx.tx.refundRequest.update({ where: { id: String(ctx.row.id) }, data }) as Promise<Row>;
}

// Approval thresholds (enforced server-side; hiding buttons is not the control):
// ≤ £500 a single approval decides the refund; > £500 the first approval parks
// it in awaiting_second_approval and a different approver must confirm.
function approve(ctx: ActionContext): Promise<Row> {
  const amount = new Prisma.Decimal(String(ctx.row.amount));
  if (ctx.row.status === "pending") {
    if (amount.lte(SINGLE_APPROVAL_LIMIT)) {
      return transition(ctx, {
        status: "approved",
        firstApproverId: ctx.user.id,
        decidedAt: new Date(),
      });
    }
    return transition(ctx, {
      status: "awaiting_second_approval",
      firstApproverId: ctx.user.id,
    });
  }
  // awaiting_second_approval — four-eyes: the confirmer must differ from the first approver.
  if (ctx.row.firstApproverId === ctx.user.id) {
    throw new ValidationError(
      "Four-eyes: the second approver must be different from the first approver.",
    );
  }
  return transition(ctx, {
    status: "approved",
    secondApproverId: ctx.user.id,
    decidedAt: new Date(),
  });
}

function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function formatDuration(ms: number): string {
  const hours = ms / (60 * 60 * 1000);
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function rowScope(user: SessionUser): Row {
  return hasRole(user, ["admin"]) ? {} : { status: { not: "rejected" } };
}

async function summary(user: SessionUser): Promise<SummaryFigure[]> {
  const scope = rowScope(user);
  const [pendingAgg, approvedThisMonthAgg, decided] = await Promise.all([
    prisma.refundRequest.aggregate({
      where: { AND: [scope, { status: { in: [...OPEN_STATUSES] } }] },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.refundRequest.aggregate({
      where: {
        AND: [scope, { status: "approved", decidedAt: { gte: startOfMonth(new Date()) } }],
      },
      _sum: { amount: true },
    }),
    prisma.refundRequest.findMany({
      where: { AND: [scope, { decidedAt: { not: null } }] },
      select: { requestedAt: true, decidedAt: true },
    }),
  ]);
  const medianMs = median(
    decided.map((row) => (row.decidedAt as Date).getTime() - row.requestedAt.getTime()),
  );
  return [
    { label: "Pending count", value: String(pendingAgg._count) },
    { label: "Pending value", value: formatMoney(pendingAgg._sum.amount ?? 0, "GBP") },
    {
      label: "Approved this month",
      value: formatMoney(approvedThisMonthAgg._sum.amount ?? 0, "GBP"),
    },
    {
      label: "Median time to decision",
      value: medianMs === null ? "—" : formatDuration(medianMs),
    },
  ];
}

export const refunds: ResourceConfig = {
  slug: "refunds",
  title: "Refunds Dashboard",
  model: "refundRequest",
  viewRoles: ["viewer", "approver", "admin"],
  // Spec 02: admin sees all including rejected history; everyone else sees
  // only non-rejected rows. Applied to list, detail, and the summary strip.
  scope: rowScope,
  include: {
    requestedBy: { select: { id: true, name: true, email: true } },
    firstApprover: { select: { id: true, name: true, email: true } },
    secondApprover: { select: { id: true, name: true, email: true } },
  },
  summary,
  columns: [
    { key: "customerName", label: "Customer" },
    { key: "orderRef", label: "Order ref" },
    { key: "amount", label: "Amount", sortable: true, render: moneyCell },
    { key: "reason", label: "Reason", kind: "badge" },
    { key: "status", label: "Status", kind: "badge" },
    { key: "requestedAt", label: "Requested", kind: "date", sortable: true },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["pending", "awaiting_second_approval", "approved", "rejected"].map((value) => ({
        value,
        label: value.replace(/_/g, " "),
      })),
    },
    {
      key: "reason",
      label: "Reason",
      type: "select",
      options: Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: "amountBand",
      label: "Amount band",
      type: "select",
      options: [
        { value: "lte_100", label: "≤ £100" },
        { value: "100_500", label: "£100 – £500" },
        { value: "500_1000", label: "£500 – £1,000" },
        { value: "gt_1000", label: "> £1,000" },
      ],
      where: (value) => {
        if (value === "lte_100") return { amount: { lte: 100 } };
        if (value === "100_500") return { amount: { gt: 100, lte: 500 } };
        if (value === "500_1000") return { amount: { gt: 500, lte: 1000 } };
        return { amount: { gt: 1000 } };
      },
    },
    { key: "requestedAt", label: "Requested", type: "daterange" },
  ],
  detailFields: [
    { key: "customerName", label: "Customer" },
    { key: "customerEmail", label: "Email" },
    { key: "orderRef", label: "Order ref" },
    { key: "amount", label: "Amount", render: moneyCell },
    { key: "currency", label: "Currency" },
    { key: "reason", label: "Reason", kind: "badge" },
    { key: "status", label: "Status", kind: "badge" },
    { key: "requestedBy.email", label: "Requested by" },
    { key: "requestedAt", label: "Requested", kind: "date" },
    { key: "firstApprover.email", label: "First approver" },
    { key: "secondApprover.email", label: "Second approver" },
    { key: "decidedAt", label: "Decided", kind: "date" },
  ],
  detailSections: [
    {
      key: "history",
      title: "Refund history",
      render: (row) => <HistorySection refundId={String(row.id)} />,
    },
  ],
  actions: [
    {
      key: "approve",
      label: "Approve",
      roles: ["approver", "admin"],
      requiresReason: true,
      visible: actionable,
      execute: approve,
    },
    {
      key: "reject",
      label: "Reject",
      roles: ["approver", "admin"],
      requiresReason: true,
      visible: actionable,
      execute: (ctx) => transition(ctx, { status: "rejected", decidedAt: new Date() }),
    },
  ],
  defaultSort: { field: "amount", dir: "desc" },
  sortTiebreak: { field: "requestedAt", dir: "asc" },
};
