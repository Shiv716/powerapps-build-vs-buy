# Internal Tools Platform — Power Apps replacement prototype

**Loom walkthrough:** _[paste link here]_

A working prototype exploring whether an engineering team can replace a low-code internal-tool
platform by building in-house with Devin.

The argument this repo makes: Devin replaces the developer, not the platform. So the honest
comparison is not *Devin vs Power Apps* — it is *Devin plus a platform layer you own* vs
Power Apps. This repo is that platform layer, plus one application built on it, plus a second
application generated from a spec to show what the marginal app actually costs.

## What's here

| Path | What it is |
|---|---|
| `/specs` | The three written specs handed to Devin. The durable asset — the apps are disposable. |
| `/app` | Next.js application: platform skeleton and the tools built on it |
| `/prisma` | Schema and seed data |

**Platform skeleton** — Entra ID SSO, role-based access control with row-level scoping, an
append-only audit log wrapping every mutation, and a config-driven CRUD framework where a new
internal tool is one resource file and one model.

**KYC review queue** — case list, detail view, claim/approve/reject/escalate with maker–checker
enforcement, full history reconstructed from audit rows.

**Refunds dashboard** — generated from `specs/02` during the recorded walkthrough.

## Running locally

```bash
pnpm install
cp .env.example .env      # fill in Entra ID client ID/secret/tenant and DATABASE_URL
pnpm prisma migrate dev
pnpm seed
pnpm dev
```

Seeded users cover each role (`viewer`, `reviewer`, `approver`, `admin`) so the access-control
behaviour is demonstrable without a live tenant.

## What is deliberately missing

- **A visual builder.** Non-engineers cannot author apps here. That is a real capability being
  traded away and it is the strongest argument for keeping a low-code platform.
- **Inherited compliance posture.** Power Apps ships with Microsoft's certifications and DLP
  policy plane. Here, audit-trail design and the evidence behind it are yours to own.
- **Vendor integrations** — no KYC provider, no payment processor. That boundary is where a
  real build consumes real time; omitting it keeps the estimate honest.
- Multi-tenancy, workflow engine, notifications, mobile layouts.

## Devin's role

The specs in `/specs` were written by hand. Devin produced the implementation against them and
pushed it here — the commit history is the record. That division is the point: the constraint
that made low-code worth paying for was engineering time on undifferentiated CRUD, and that is
the part Devin removes. It does not remove the platform, and it does not own the compliance answer.
