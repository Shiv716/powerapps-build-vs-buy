import type { ReactNode } from "react";
import type { Row } from "@/lib/resources/types";

const BADGE_STYLES: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
  pending: "bg-slate-100 text-slate-700",
  in_review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  escalated: "bg-amber-100 text-amber-800",
};

/** Resolves a (possibly dotted) column key against a row, e.g. "assignee.name". */
export function cellValue(row: Row, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object") return (value as Row)[segment];
    return undefined;
  }, row);
}

export function formatCell(value: unknown, kind?: "text" | "badge" | "date" | "json"): ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }
  if (kind === "date" || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(String(value));
    return (
      <time dateTime={date.toISOString()} className="tabular-nums">
        {date.toISOString().slice(0, 16).replace("T", " ")}
      </time>
    );
  }
  if (kind === "badge") {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          BADGE_STYLES[String(value)] ?? BADGE_STYLES.default
        }`}
      >
        {String(value)}
      </span>
    );
  }
  if (kind === "json" || typeof value === "object") {
    return (
      <pre className="max-w-md overflow-x-auto rounded bg-slate-50 p-2 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return String(value);
}
