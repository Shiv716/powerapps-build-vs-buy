import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import type { Role, SessionUser } from "@/lib/roles";
import { isRole } from "@/lib/roles";

export const devSignInEnabled = process.env.NODE_ENV !== "production";

const providers: NextAuthOptions["providers"] = [
  AzureADProvider({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID ?? "",
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ?? "",
    tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ?? "",
  }),
];

if (devSignInEnabled) {
  providers.push(
    CredentialsProvider({
      id: "dev-sign-in",
      name: "Development sign-in",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
        });
        token.userId = dbUser?.id;
        token.roles = (dbUser?.roles ?? []).filter(isRole);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.userId ?? "",
        email: token.email ?? "",
        name: token.name ?? "",
        roles: (token.roles ?? []) as Role[],
      };
      return session;
    },
  },
};

export type DevSignInUser = { email: string; name: string; roles: string[] };

export async function listDevSignInUsers(): Promise<DevSignInUser[]> {
  if (!devSignInEnabled) return [];
  return prisma.user.findMany({
    select: { email: true, name: true, roles: true },
    orderBy: { email: "asc" },
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles: session.user.roles,
  };
}
