# Release Evidence — Documents

**Audit date:** 2026-06-27 · **Auditor:** Claude Code · **Branch:** main
**QA matrix:** [qa-release/sections/15-documents.md](../../../qa-release/sections/15-documents.md)

Section: Documents — surfaced at `/property-manager/documents` via `/compliance/documents`.

## Surfaces / routes tested

| Route | Result |
|-------|--------|
| `/property-manager/compliance/documents` (list) | 55/55 |
| `/property-manager/compliance/documents/[id]` (detail) | 30/30 |
| **Total** | **85/85 = 100%** |

## Data wiring (no mock data)

- **List** reads the `documents` table via `useComplianceDocuments()` — live, filtered by
  `compliance_item_id` + category, scoped by `workspace_id` on every query.
- **KPI strip** (Total / Verified / Pending Review / Expiring Soon) is computed entirely from
  real records using `daysUntil()` + status filtering — no hardcoded counts.
- **Detail** reads from `documents`; inline edits (name, category, expiry) are workspace-scoped
  mutations that persist.

## Buttons / actions (all wired — no dead controls)

- Upload → R2-backed dialog, workspace-scoped (storage path keyed to workspace + record).
- Export CSV → real data download scoped to current filters.
- Refresh → `useQueryClient().invalidateQueries()`.
- Row actions: View / Download (signed URL from R2) / Archive (soft-delete with `ConfirmDialog`).
- Detail: Download (signed URL), Archive (confirm → soft-delete), Activity tab (`audit_logs`
  query for the document), breadcrumb Compliance › Documents › [name].

## States

- Empty state ("No documents yet" + Upload CTA), loading skeleton rows, and verification-status
  filter chips (Verified / Pending / Rejected) all present and correct.

## Storage / security

- Uploads workspace- and record-scoped; downloads via signed R2 URLs; archive is soft-delete.
- All list/detail queries carry the `workspace_id` filter (RLS-aligned).

## Audit trail

- Document Activity tab is backed by `audit_logs` for the document id.

## Final score & decision

**100/100 — Ready for release.** No dead buttons, no stub flows, no placeholder data; every
data surface is live-wired with proper empty/loading states.
