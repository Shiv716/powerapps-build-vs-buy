import type { FilterDef } from "@/lib/resources/types";

type FilterBarProps = {
  filters: FilterDef[];
  values: Record<string, string>;
  basePath: string;
};

export function FilterBar({ filters, values, basePath }: FilterBarProps) {
  if (filters.length === 0) return null;
  return (
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-end gap-3">
      {filters.map((filter) => (
        <label key={filter.key} className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {filter.label}
          {filter.type === "select" ? (
            <select
              name={filter.key}
              defaultValue={values[filter.key] ?? ""}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            >
              <option value="">All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={filter.type === "date" ? "date" : "text"}
              name={filter.key}
              defaultValue={values[filter.key] ?? ""}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            />
          )}
        </label>
      ))}
      <button
        type="submit"
        className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Filter
      </button>
      <a href={basePath} className="px-2 py-1.5 text-sm text-slate-500 hover:text-slate-900">
        Reset
      </a>
    </form>
  );
}
