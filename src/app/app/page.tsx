import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { resources } from "@/lib/resources/registry";

export default async function AppHome() {
  const user = await getSessionUser();
  const list = Array.from(resources.values());

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Internal tools</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as {user?.email} with roles [{user?.roles.join(", ") || "none"}].
      </p>
      {list.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tools registered yet. A tool is one resource file and one Prisma model.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((resource) => (
            <li key={resource.slug}>
              <Link
                href={`/app/${resource.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400"
              >
                <span className="font-medium text-slate-900">{resource.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
