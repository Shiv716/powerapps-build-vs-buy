"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type DevUser = {
  email: string;
  name: string;
  roles: string[];
};

export function DevSignInForm({
  users,
  callbackUrl,
}: {
  users: DevUser[];
  callbackUrl: string;
}) {
  const [email, setEmail] = useState(users[0]?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        void signIn("dev-sign-in", { email, callbackUrl });
      }}
    >
      <select
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        aria-label="Seeded user"
      >
        {users.map((user) => (
          <option key={user.email} value={user.email}>
            {user.name} — {user.roles.join(", ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Sign in as selected user
      </button>
    </form>
  );
}
