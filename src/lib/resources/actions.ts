import { auditDenied, withAudit } from "@/lib/audit";
import { ForbiddenError, hasRole, requestIp } from "@/lib/rbac";
import type { SessionUser } from "@/lib/roles";
import { getRow } from "@/lib/resources/query";
import type { ResourceConfig, Row } from "@/lib/resources/types";

export class NotFoundError extends Error {}
export class ValidationError extends Error {}

/**
 * Executes a declared row action: checks the action's role requirement
 * (auditing denials), re-applies the resource scope to the target row, and
 * runs the mutation through withAudit().
 */
export async function executeResourceAction(
  resource: ResourceConfig,
  actionKey: string,
  user: SessionUser,
  rowId: string,
  reason: string | undefined,
  category?: string,
): Promise<Row> {
  const action = resource.actions.find((a) => a.key === actionKey);
  if (!action) throw new NotFoundError(`Unknown action: ${actionKey}`);

  const actor = { id: user.id, email: user.email, ip: requestIp() };
  if (!hasRole(user, action.roles)) {
    await auditDenied(actor, {
      entityType: resource.model,
      entityId: rowId,
      requiredRoles: action.roles,
    });
    throw new ForbiddenError(action.roles);
  }
  if (action.requiresReason && !reason?.trim()) {
    throw new ValidationError("A reason is required for this action.");
  }
  if (action.category) {
    if (!category || !action.category.options.some((o) => o.value === category)) {
      throw new ValidationError(`A ${action.category.label.toLowerCase()} is required for this action.`);
    }
  }

  return withAudit<Row>(
    actor,
    {
      action: `${resource.slug}.${action.key}`,
      entityType: resource.model,
      reason: reason?.trim() || null,
    },
    async (tx) => {
      const before = await getRow(resource, user, rowId, tx, { include: false });
      if (!before) throw new NotFoundError("Row not found or out of scope.");
      if (action.visible && !action.visible(before, user)) {
        throw new ValidationError("Action not available for this row.");
      }
      const after = await action.execute({ tx, user, row: before, reason: reason?.trim(), category });
      return { result: after, entityId: rowId, before, after };
    },
  );
}
