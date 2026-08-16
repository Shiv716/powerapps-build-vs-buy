import type { ReactNode } from "react";

const BADGE_STYLES: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
};

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
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES.default}`}
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
