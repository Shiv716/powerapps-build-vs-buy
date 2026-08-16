import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/roles";

export type AuditActor = Pick<SessionUser, "id" | "email"> & { ip?: string | null };

export type AuditMeta = {
  action: string;
  entityType: string;
  reason?: string | null;
};

export type MutationResult<T> = {
  result: T;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

/**
 * The single boundary for mutations. Runs the mutation and appends the audit
 * row in one transaction: if the audit write fails, the mutation rolls back.
 */
export async function withAudit<T>(
  actor: AuditActor,
  meta: AuditMeta,
  mutate: (tx: Prisma.TransactionClient) => Promise<MutationResult<T>>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const { result, entityId, before, after } = await mutate(tx);
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: meta.action,
        entityType: meta.entityType,
        entityId,
        before: (before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (after ?? undefined) as Prisma.InputJsonValue | undefined,
        reason: meta.reason ?? null,
        ip: actor.ip ?? null,
      },
    });
    return result;
  });
}

/** Appends an audit row for a denied authorisation attempt. */
export async function auditDenied(
  actor: AuditActor,
  details: { entityType: string; entityId?: string; requiredRoles: string[] },
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action: "auth.denied",
      entityType: details.entityType,
      entityId: details.entityId ?? "-",
      after: { requiredRoles: details.requiredRoles },
      ip: actor.ip ?? null,
    },
  });
}
