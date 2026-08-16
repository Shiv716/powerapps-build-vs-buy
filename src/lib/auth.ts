import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/db";
import type { Role, SessionUser } from "@/lib/roles";
import { isRole } from "@/lib/roles";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID ?? "",
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ?? "",
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ?? "",
    }),
  ],
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
