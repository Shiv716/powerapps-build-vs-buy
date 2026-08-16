# Spec 00 — Internal Tools Platform (skeleton)

## Purpose
A reusable substrate for internal tools. Every app built on it inherits authentication,
authorisation, and a tamper-evident audit trail without re-implementing them. This is the
layer a low-code platform sells; building it once is the precondition for building apps cheaply.

## Stack
- Next.js (App Router) + TypeScript
- PostgreSQL via Prisma
- NextAuth with a Microsoft Entra ID provider
- Tailwind + a small shared component set (table, filter bar, detail panel, action dialog)

## Requirements

### Auth
- SSO via Entra ID. No local password auth, no signup flow.
- Session carries `userId`, `email`, `roles: string[]`.
- Unauthenticated requests to anything under `/app` redirect to sign-in.

### RBAC
- Roles are coarse and app-scoped: `viewer`, `reviewer`, `approver`, `admin`.
- A single `requireRole()` guard usable in both server components and route handlers.
- Row-level scoping helper: a resource can declare a `scope(user)` function returning a
  Prisma `where` fragment. The list and detail queries must both apply it — not just the list.
- Authorisation failures return 403 and are themselves audited.

### Audit log
- Append-only table. No update or delete paths exist in application code.
- Columns: `id`, `actorId`, `actorEmail`, `action`, `entityType`, `entityId`, `before` (jsonb),
  `after` (jsonb), `reason`, `ip`, `createdAt`.
- Every mutation goes through a `withAudit()` wrapper. A mutation that bypasses it should be
  impossible to write accidentally — mutations live behind a single module boundary.
- An `/app/audit` view, admin-only, filterable by actor, entity and date.

### Config-driven CRUD
- A resource is declared as one object: Prisma model, column definitions, filters, row actions,
  detail fields, and per-action role requirements.
- The framework renders list view (server-side pagination, sort, filter), detail view, and
  action dialogs from that declaration.
- Adding a new internal tool should mean adding one resource file and one Prisma model.

### Seed
- `pnpm seed` populates realistic fake data for all resources.
- Seeded users cover each role so the RBAC behaviour is demonstrable without a real tenant.

## Explicitly out of scope
- Multi-tenancy, workflow engine, notification system, mobile layout, i18n.
- A visual builder. Non-engineers do not author apps on this platform — that is a real
  capability being traded away and it should not be papered over.

## Done when
- A demo user can sign in, see only rows their role permits, take an action that requires a
  reason, and find that action in the audit view within one page load.
