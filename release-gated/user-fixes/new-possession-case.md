# User / Manual Fixes — New Possession Case wizard

The wizard is release-ready for England & Wales (98/100). Nothing here blocks the release.

## 1. Abandon-on-Step-1 leaves a draft case row — V1.5 polish
**Behaviour:** Step 1 (Select Tenancy) creates the `possession_cases` row immediately (status `gathering_evidence`) so later steps can attach evidence/uploads against a real id. If the user abandons the wizard there, that row remains in the possession list.

**Why left as-is (not a blocker):** the row is honest live data (a started case), is workspace-RLS-scoped, and is fully editable/deletable from the possession list. It is not mislabelled as anything other than "gathering evidence".

**Exact steps to tighten later (optional):**
1. Either: defer case creation to Step 2 (after grounds chosen), keeping Step 1 selection in client state; **or**
2. Add a `draft` boolean / `status='draft'` and filter drafts out of dashboard counts + KPIs, with a periodic cleanup of drafts older than N days (mirror the `demo_expires_at` lifecycle already on the table).

## 2. Cross-jurisdiction possession (Scotland / NI) — V2 (external review required)
Section 8 / Section 21 are England & Wales statute. Scotland uses a Notice to Leave via the First-tier Tribunal; NI uses a Notice to Quit. These are **different workflows**, not relabels, and need professional review before building. Current safe behaviour: the whole possession subtree is gated to E&W (`LegalJurisdictionGate module="possession"`, layout-level → direct URLs covered); other jurisdictions get the panel + generic record-keeping. No incorrect statute is shown.

## Nothing else outstanding
- Rent-arrears capture added (was always £0) — build + tsc clean, RLS enforced, evidence uploads R2-scoped.
