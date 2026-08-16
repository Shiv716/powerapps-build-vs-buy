"use client";

import { signIn } from "next-auth/react";

export function EntraSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      type="button"
      onClick={() => void signIn("azure-ad", { callbackUrl })}
      className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
    >
      Sign in with Microsoft Entra ID
    </button>
  );
}
