# Spec 02 — Refunds Dashboard

**Status: not built at time of recording.** This spec exists to be handed to Devin live, to
demonstrate the marginal cost of the second application against a stable platform.

Built on the platform skeleton (Spec 00). Same inheritance: SSO, RBAC, audit, config-driven CRUD.

## Data model
`RefundRequest`
- `id`, `customerName`, `customerEmail`, `orderRef`
- `amount` (decimal), `currency`
- `reason` (`duplicate` | `fraud` | `service_failure` | `goodwill`)
- `status`: `pending` | `approved` | `rejected` | `awaiting_second_approval`
- `requestedById`, `requestedAt`
- `firstApproverId`, `secondApproverId`, `decidedAt`

## List view
- Columns: customer, order ref, amount, reason, status, requested.
- Filters: status, reason, amount band, date range.
- Default sort: amount descending.
- `viewer` read-only; `approver`+ sees actions; `admin` sees all including rejected history.

## Actions
- **Approve** — `approver`+, requires a reason.
  - Amount ≤ £500: single approval, moves straight to `approved`.
  - Amount > £500: first approval moves to `awaiting_second_approval`; a *different*
    `approver` must confirm. Enforce server-side.
- **Reject** — `approver`+, requires a reason.
- Every action writes an audit entry with before/after state.

## Summary strip
- Four figures at the top of the list: pending count, pending value, approved value this month,
  median time to decision. Computed server-side, no client aggregation.

## Deliberate omissions
- No payment-processor integration. Approving marks state; it does not move money. The
  integration boundary is where a real build costs real time, and pretending otherwise would
  misrepresent the estimate.

## Done when
- Both approval thresholds behave correctly, the second approver cannot be the first, and the
  summary strip agrees with the underlying rows.
