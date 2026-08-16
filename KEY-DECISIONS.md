# Key Decisions

**Shivang Chaudhary: Power Apps vs Devin, build-vs-buy evaluation**
Repo: `powerapps-build-vs-buy` · ~3.5 hours total

## What I scoped, and why

I decided early that building a clone of a Power Apps *app* would answer the wrong question. The screen builder is the visible part of Power Apps and the least valuable one. What the client is actually buying is the platform underneath, Dataverse-backed row-level security, audit history, inherited Entra identity, inherited compliance posture, and a governance plane. So the honest comparison isn't Devin versus Power Apps. It's Devin plus a platform layer the client owns and maintains forever, versus Power Apps.

I built to that thesis: a thin internal-tools platform (Entra SSO, RBAC with row-level scoping, an append-only audit log, and a config-driven CRUD framework), then the KYC review queue on top of it, then the refunds dashboard as a second app to measure marginal cost. Three specs written by hand, three Devin sessions, PR review between each.

The measurement was the point. A single working app proves Devin can code, which nobody disputes. The second app is what tells you what building thirteen tools actually costs.

## Key architectural decisions

**Audit as a transactional boundary, not a convention.** Every mutation runs inside a `withAudit()` wrapper that writes the audit row in the same database transaction as the change. If the audit write fails, the mutation rolls back. Most hand-rolled audit logs are fire-and-forget after commit and lose rows silently, for a KYC surface that's the difference between an audit trail and a log file. Backed by an ESLint `no-restricted-imports` rule so UI and route code can't reach the Prisma client directly, plus CI running lint on every PR. The lint rule is a guardrail, not a proof, I'd want a runtime check before production.

**Config-driven resources over generated apps.** A resource is one declarative object, model, columns, filters, actions with per-action roles, and an optional `scope(user)` predicate applied to list, detail and action queries alike. This is the bet that decides whether marginal cost falls. Generating each app independently would have demoed faster and told me nothing.

**Dev-only credentials provider.** Configuring a real tenant is setup cost with no demo payoff, so I had Devin add a passwordless provider gated behind `NODE_ENV !== "production"`, verified against an actual production build. Entra remains the production path.

## Tradeoffs I made deliberately

No visual builder, so non-engineers can't author apps, that's the single strongest argument for keeping Power Apps and I left it visible rather than papering over it. No vendor integrations (KYC provider, payment processor); that boundary is where a real build consumes real time and faking it would have corrupted the estimate. No multi-tenancy, workflow engine, or notifications.

## What I found, including what cuts against me

App one required nine platform files to change. App two required three, all additive extensions. Seven minutes from spec to reviewed PR. So the marginal cost curve is real but it decays rather than starting at zero, the first few apps co-develop the platform. I'd rather present that than a staged "second app was free."

The more useful finding was a failure. I specified maker–checker as "the user who claimed a case cannot approve it." Devin implemented that exactly. But an approver could still decide an *unclaimed* case, so on the most common path the control silently did nothing. My spec was wrong; the code was faithful. A human reading the diff caught it. Row scoping on the refunds app had the same shape, ambiguous spec, silently resolved in a defensible but different way.

That's the finding I built the recommendation around: Devin removes build capacity as the constraint and relocates it to spec quality and review capacity. In regulated surfaces, a control that looks correct but doesn't hold is worse than an absent one, because nobody keeps checking it.

## Where I'm least confident

The maintenance estimate. I can measure build cost directly, I'm extrapolating the ongoing burden of dependency churn, SSO breakage and compliance evidence from prior experience rather than from anything in this repo. The $250k ≈ one fully-loaded engineer framing is a useful anchor, not a model. And two data points don't make a curve, app four is where the abstraction claim actually gets tested, which is why I put a kill criterion in the recommendation rather than a projection.
