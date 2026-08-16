import { formatCell } from "@/components/format";
import type { DetailFieldDef, Row } from "@/lib/resources/types";

type DetailPanelProps = {
  fields: DetailFieldDef[];
  row: Row;
};

export function DetailPanel({ fields, row }: DetailPanelProps) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {field.label}
          </dt>
          <dd className="mt-1 text-sm text-slate-900">{formatCell(row[field.key], field.kind)}</dd>
        </div>
      ))}
    </dl>
  );
}
