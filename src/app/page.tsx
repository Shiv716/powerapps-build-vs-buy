import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Internal Tools Platform</h1>
        <p className="mt-2 text-sm text-slate-500">
          Entra ID SSO, role-based access with row-level scoping, an append-only audit
          log, and a config-driven CRUD framework.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
