import Link from "next/link";
import { cellValue, formatCell } from "@/components/format";
import type { ColumnDef, Row } from "@/lib/resources/types";

type DataTableProps = {
  columns: ColumnDef[];
  rows: Row[];
  page: number;
  pageCount: number;
  total: number;
  sortField: string;
  sortDir: "asc" | "desc";
  basePath: string;
  query: Record<string, string>;
  rowHref?: (row: Row) => string;
};

function buildHref(basePath: string, query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function DataTable({
  columns,
  rows,
  page,
  pageCount,
  total,
  sortField,
  sortDir,
  basePath,
  query,
  rowHref,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.sortable ? (
                  <Link
                    href={buildHref(basePath, {
                      ...query,
                      sort: col.key,
                      dir: sortField === col.key && sortDir === "asc" ? "desc" : "asc",
                      page: "1",
                    })}
                    className="hover:text-slate-900"
                  >
                    {col.label}
                    {sortField === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </Link>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                No rows match.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={String(row.id ?? i)} className="hover:bg-slate-50">
                {columns.map((col, j) => (
                  <td key={col.key} className="px-4 py-3">
                    {j === 0 && rowHref ? (
                      <Link href={rowHref(row)} className="font-medium text-blue-700 hover:underline">
                        {formatCell(cellValue(row, col.key), col.kind)}
                      </Link>
                    ) : (
                      formatCell(cellValue(row, col.key), col.kind)
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-sm text-slate-500">
        <span>
          {total} row{total === 1 ? "" : "s"} · page {page} of {pageCount}
        </span>
        <span className="flex gap-2">
          {page > 1 && (
            <Link
              href={buildHref(basePath, { ...query, page: String(page - 1) })}
              className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          {page < pageCount && (
            <Link
              href={buildHref(basePath, { ...query, page: String(page + 1) })}
              className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}
