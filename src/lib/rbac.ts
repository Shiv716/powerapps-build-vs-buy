import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auditDenied } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth";
import type { Role, SessionUser } from "@/lib/roles";

export class ForbiddenError extends Error {
  constructor(public readonly requiredRoles: Role[]) {
    super(`Forbidden: requires one of [${requiredRoles.join(", ")}]`);
    this.name = "ForbiddenError";
  }
}

export function hasRole(user: SessionUser, roles: Role[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function requestIp(): string | null {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

type RequireRoleOptions = {
  entityType?: string;
  entityId?: string;
  /**
   * "redirect" (server components): send the user to the /app/denied page.
   * "throw" (route handlers): raise ForbiddenError for the handler to map to
   * an HTTP 403 response. Both paths audit the denial first.
   */
  onDenied?: "redirect" | "throw";
};

export async function requireRole(
  roles: Role[],
  options: RequireRoleOptions = {},
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    if (options.onDenied === "throw") throw new ForbiddenError(roles);
    redirect("/api/auth/signin");
  }
  if (!hasRole(user, roles)) {
    await auditDenied(
      { id: user.id, email: user.email, ip: requestIp() },
      {
        entityType: options.entityType ?? "route",
        entityId: options.entityId,
        requiredRoles: roles,
      },
    );
    if (options.onDenied === "throw") throw new ForbiddenError(roles);
    redirect("/app/denied");
  }
  return user;
}
