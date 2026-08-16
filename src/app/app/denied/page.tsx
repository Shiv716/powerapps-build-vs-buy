import Link from "next/link";

export default function DeniedPage() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <h1 className="text-lg font-semibold text-red-800">403 — Access denied</h1>
      <p className="mt-2 text-sm text-red-700">
        Your roles do not permit that. The attempt has been recorded in the audit log.
      </p>
      <Link href="/app" className="mt-4 inline-block text-sm font-medium text-red-800 underline">
        Back to tools
      </Link>
    </div>
  );
}
