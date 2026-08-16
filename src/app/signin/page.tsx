import { redirect } from "next/navigation";
import { devSignInEnabled, getSessionUser, listDevSignInUsers } from "@/lib/auth";
import { DevSignInForm } from "./dev-sign-in-form";
import { EntraSignInButton } from "./entra-sign-in-button";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect(searchParams.callbackUrl ?? "/app");

  const callbackUrl = searchParams.callbackUrl ?? "/app";

  const devUsers = await listDevSignInUsers();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-center text-xl font-semibold text-slate-900">Sign in</h1>
        {searchParams.error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in failed. Check that the account exists and try again.
          </p>
        )}
        <div className="mt-6">
          <EntraSignInButton callbackUrl={callbackUrl} />
        </div>
        {devSignInEnabled && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-medium text-slate-700">Development sign-in</h2>
            <p className="mt-1 text-xs text-slate-500">
              Sign in as a seeded user without a Microsoft tenant. Not available in
              production builds.
            </p>
            <DevSignInForm users={devUsers} callbackUrl={callbackUrl} />
          </div>
        )}
      </div>
    </main>
  );
}
