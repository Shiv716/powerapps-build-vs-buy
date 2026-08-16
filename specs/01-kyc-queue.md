# Spec 01 — KYC Review Queue

Built on the platform skeleton (Spec 00). Assumes SSO, RBAC, audit and config-driven CRUD
already exist. This spec adds a resource, not infrastructure.

## Data model
`KycCase`
- `id`, `applicantName`, `applicantEmail`, `country`, `dateOfBirth`
- `riskScore` (int, 0–100), `riskBand` (derived: low / medium / high)
- `status`: `pending` | `in_review` | `approved` | `rejected` | `escalated`
- `assigneeId` (nullable)
- `submittedAt`, `decidedAt`, `decidedById`

`KycDocument`
- `id`, `caseId`, `type` (`passport` | `driving_licence` | `proof_of_address`), `fileUrl`,
  `uploadedAt`

## List view
- Columns: applicant, country, risk band, status, assignee, submitted.
- Filters: status, risk band, assignee, country, date range.
- Default sort: risk score descending, then oldest first.
- `viewer` sees the list read-only. `reviewer` sees only cases assigned to them or unassigned.
  `admin` sees all. This is a row-level scope, enforced on detail as well as list.

## Detail view
- Applicant fields, document list with thumbnails, risk score with band, full case history
  rendered from the audit log for that entity.

## Actions
- **Claim** — `reviewer`+, sets assignee, moves `pending` → `in_review`.
- **Approve** — `approver`+, requires a free-text reason.
- **Reject** — `approver`+, requires a reason and a category.
- **Escalate** — `reviewer`+, requires a reason.
- Maker–checker: the user who claimed a case cannot approve it. Enforce server-side; the
  UI hint is not the control.
- Every action writes an audit entry with before/after state and the reason.

## Deliberate omissions
- No document upload, no OCR, no sanctions/PEP screening, no real KYC provider integration.
  These are vendor integrations, not evidence of platform capability, and would consume the
  entire time budget.

## Done when
- A reviewer can claim, escalate and be blocked from self-approving; an approver can decide;
  and the case history in the UI reconstructs exactly what happened from audit rows alone.
