/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import { ValidationError } from "@/lib/resources/actions";
import type { ActionContext, ResourceConfig, Row } from "@/lib/resources/types";
import { formatCell } from "@/components/format";

const DOCUMENT_LABELS: Record<string, string> = {
  passport: "Passport",
  driving_licence: "Driving licence",
  proof_of_address: "Proof of address",
};

type CaseDocument = {
  id: string;
  type: string;
  fileUrl: string;
  uploadedAt: Date;
};

function DocumentsSection({ documents }: { documents: CaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No documents on file.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {documents.map((doc) => (
        <li key={doc.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <img
            src={doc.fileUrl}
            alt={DOCUMENT_LABELS[doc.type] ?? doc.type}
            className="h-28 w-full rounded border border-slate-100 object-cover"
          />
          <p className="mt-2 text-sm font-medium text-slate-900">
            {DOCUMENT_LABELS[doc.type] ?? doc.type}
          </p>
          <p className="text-xs text-slate-500">
            Uploaded {formatCell(doc.uploadedAt, "date")}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Scalar fields worth surfacing when diffing audit before/after snapshots. */
const TRACKED_FIELDS = ["status", "assigneeId", "decidedById", "decidedAt"] as const;

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

async function HistorySection({ caseId }: { caseId: string }) {
  const entries = await prisma.auditLog.findMany({
    where: { entityType: "kycCase", entityId: caseId },
    orderBy: { createdAt: "asc" },
  });
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No history recorded for this case.
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

function decidable(row: Row): boolean {
  return ["pending", "in_review", "escalated"].includes(String(row.status));
}

async function transition(
  ctx: ActionContext,
  data: Record<string, unknown>,
): Promise<Row> {
  return ctx.tx.kycCase.update({ where: { id: String(ctx.row.id) }, data }) as Promise<Row>;
}

export const kycCases: ResourceConfig = {
  slug: "kyc-cases",
  title: "KYC Review Queue",
  model: "kycCase",
  viewRoles: ["viewer", "reviewer", "approver", "admin"],
  // Spec 01: viewers see the list read-only, reviewers only their own or
  // unassigned cases, admins everything. Applied to list AND detail.
  scope: (user) => {
    if (hasRole(user, ["admin"])) return {};
    if (hasRole(user, ["reviewer"])) {
      return { OR: [{ assigneeId: user.id }, { assigneeId: null }] };
    }
    return {};
  },
  include: {
    assignee: { select: { id: true, name: true, email: true } },
    decidedBy: { select: { id: true, name: true, email: true } },
    documents: { orderBy: { uploadedAt: "asc" } },
  },
  columns: [
    { key: "applicantName", label: "Applicant" },
    { key: "country", label: "Country" },
    { key: "riskBand", label: "Risk band", kind: "badge" },
    { key: "status", label: "Status", kind: "badge" },
    { key: "assignee.name", label: "Assignee" },
    { key: "submittedAt", label: "Submitted", kind: "date", sortable: true },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["pending", "in_review", "approved", "rejected", "escalated"].map((value) => ({
        value,
        label: value.replace("_", " "),
      })),
    },
    {
      key: "riskBand",
      label: "Risk band",
      type: "select",
      options: ["low", "medium", "high"].map((value) => ({ value, label: value })),
    },
    {
      key: "assignee",
      label: "Assignee",
      type: "select",
      options: [
        { value: "me", label: "Assigned to me" },
        { value: "unassigned", label: "Unassigned" },
        { value: "assigned", label: "Assigned to anyone" },
      ],
      where: (value, user) => {
        if (value === "me") return { assigneeId: user.id };
        if (value === "unassigned") return { assigneeId: null };
        return { assigneeId: { not: null } };
      },
    },
    { key: "country", label: "Country", type: "text" },
    { key: "submittedAt", label: "Submitted", type: "daterange" },
  ],
  detailFields: [
    { key: "applicantName", label: "Applicant" },
    { key: "applicantEmail", label: "Email" },
    { key: "country", label: "Country" },
    { key: "dateOfBirth", label: "Date of birth", kind: "date" },
    { key: "riskScore", label: "Risk score" },
    { key: "riskBand", label: "Risk band", kind: "badge" },
    { key: "status", label: "Status", kind: "badge" },
    { key: "assignee.name", label: "Assignee" },
    { key: "submittedAt", label: "Submitted", kind: "date" },
    { key: "decidedAt", label: "Decided", kind: "date" },
    { key: "decidedBy.email", label: "Decided by" },
  ],
  detailSections: [
    {
      key: "documents",
      title: "Documents",
      render: (row) => <DocumentsSection documents={(row.documents ?? []) as CaseDocument[]} />,
    },
    {
      key: "history",
      title: "Case history",
      render: (row) => <HistorySection caseId={String(row.id)} />,
    },
  ],
  actions: [
    {
      key: "claim",
      label: "Claim",
      roles: ["reviewer", "approver", "admin"],
      visible: (row) => row.status === "pending",
      execute: (ctx) =>
        transition(ctx, { assigneeId: ctx.user.id, status: "in_review" }),
    },
    {
      key: "approve",
      label: "Approve",
      roles: ["approver", "admin"],
      requiresReason: true,
      visible: decidable,
      execute: (ctx) => {
        // Maker–checker: enforced here, server-side; hiding the button is not the control.
        if (ctx.row.assigneeId === ctx.user.id) {
          throw new ValidationError(
            "Maker–checker: the user who claimed a case cannot approve it.",
          );
        }
        return transition(ctx, {
          status: "approved",
          decidedAt: new Date(),
          decidedById: ctx.user.id,
        });
      },
    },
    {
      key: "reject",
      label: "Reject",
      roles: ["approver", "admin"],
      requiresReason: true,
      category: {
        label: "Category",
        options: [
          { value: "document_invalid", label: "Document invalid or illegible" },
          { value: "identity_mismatch", label: "Identity mismatch" },
          { value: "sanctions_risk", label: "Sanctions risk" },
          { value: "fraud_suspected", label: "Fraud suspected" },
          { value: "other", label: "Other" },
        ],
      },
      visible: decidable,
      execute: (ctx) =>
        transition(ctx, {
          status: "rejected",
          decidedAt: new Date(),
          decidedById: ctx.user.id,
        }),
    },
    {
      key: "escalate",
      label: "Escalate",
      roles: ["reviewer", "approver", "admin"],
      requiresReason: true,
      visible: (row) => ["pending", "in_review"].includes(String(row.status)),
      execute: (ctx) => transition(ctx, { status: "escalated" }),
    },
  ],
  defaultSort: { field: "riskScore", dir: "desc" },
  sortTiebreak: { field: "submittedAt", dir: "asc" },
};
