# SAR & Data Rights Runbook

Controller: Blackwellen Ltd (Propvora), ICO ZC160806. Rights inbox: legal@propvora.com.

Covers UK GDPR rights: access (SAR), portability, erasure, rectification,
restriction, objection. Statutory response time: **1 month** (extendable to 3 for
complex requests, with notice).

## Channels
- In-app: Account → Data & Privacy → "Request data export" / "Request account deletion".
  Both require **password re-authentication** and create a tracked request:
  - Export → `data_export_requests` (status pending→processing→ready→expired).
  - Erasure → `account_deletion_requests` (30-day `scheduled_for` grace).
- Email: legal@propvora.com (verify identity before actioning).

## SAR / data export — steps
1. Confirm request appears in `data_export_requests` (or log a manual one).
2. Verify identity (in-app requests are pre-authenticated; email requests need verification).
3. Set status `processing`. Compile the subject's data:
   profile, workspace memberships, contacts they are the subject of, communications,
   files, AI content, audit entries about them.
4. **Redact third-party personal data** not belonging to the requester.
5. Produce export (JSON/CSV + files), upload to a **private** R2 location, set
   `download_key`, `ready_at`, `expires_at` (e.g. 7 days). Notify via Resend.
6. Set status `ready`; auto-expire the link after `expires_at`.

## Erasure — steps
1. Request in `account_deletion_requests` (status `pending`/`scheduled`).
2. 30-day grace: user may cancel (contact support@propvora.com).
3. On `scheduled_for`, the erasure worker (TODO — destructive; built separately):
   anonymise/delete profile, auth identity, memberships, AI logs, files, portal
   identities, notifications. **Retain** financial records + minimal audit/security
   logs per retention-schedule.md (legal obligation).
4. Confirm removal from UI, search, AI context, exports, reports, portals.
5. Set `completed_at`, status `completed`. Email confirmation.

## Distinctions
- **Individual user** deletion ≠ **workspace** deletion. A non-owner cannot destroy
  a workspace's data; the owner must transfer or delete the workspace first.

## Evidence
Keep the request records (minimised) to evidence compliance. Do not over-retain.
