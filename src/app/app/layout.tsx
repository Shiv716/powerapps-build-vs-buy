import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";
import { resources } from "@/lib/resources/registry";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/api/auth/signin");

  const isAdmin = user.roles.includes("admin");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/app" className="font-semibold text-slate-900">
              Internal Tools
            </Link>
            {Array.from(resources.values()).map((resource) => (
              <Link
                key={resource.slug}
                href={`/app/${resource.slug}`}
                className="text-slate-600 hover:text-slate-900"
              >
                {resource.title}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/app/audit" className="text-slate-600 hover:text-slate-900">
                Audit log
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {user.email}
              {user.roles.length > 0 && (
                <span className="ml-2 text-xs text-slate-400">[{user.roles.join(", ")}]</span>
              )}
            </span>
            <Link href="/api/auth/signout" className="text-slate-600 hover:text-slate-900">
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
