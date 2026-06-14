# Lawful Basis Register (Art. 6 UK GDPR)

Controller: Blackwellen Ltd (Propvora), Company No. 16482166, ICO ZC160806.
Contact: legal@propvora.com.

This register records the **lawful basis** Blackwellen Ltd relies on for each
processing activity it carries out **as controller** of the Propvora service. It
cross-references `ropa.md` (same activity numbering) and `data-map.md`. Where an
operator processes their own contacts/tenancy data, the operator is the
controller and Blackwellen Ltd is the **processor** under the DPA
(`/legal/data-processing`) — those rows are marked *(processor)* and the
operator must hold their own lawful basis.

## Register

| ROPA # | Activity | Art. 6 basis | Notes |
|--------|----------|--------------|-------|
| 1 | Account registration & auth | **Contract** (Art. 6(1)(b)) | Necessary to create/operate the account the user signs up for. Identity + credentials via Supabase auth. |
| 2 | Workspace operations (portfolio, tenancies, jobs, money) | **Contract** | Core service delivery to the subscribing operator. Third-party (tenant/supplier) data within is processed *(processor)* on the operator's basis. |
| 3 | Contact management | *(processor)* | Operator is controller of its contacts; operator's basis (typically legitimate interest / contract with its own tenants/suppliers). |
| 4 | Billing & subscriptions | **Contract** + **Legal obligation** (Art. 6(1)(c)) | Taking payment is contractual; retaining financial records 6 years is a legal/tax obligation. No card data held (Stripe, PCI DSS). |
| 5 | Owner payouts via Connect (flagged OFF) | **Contract** | Only if the operator opts into Stripe Connect Standard; currently disabled. |
| 6 | Transactional email | **Contract** + **Legitimate interest** (Art. 6(1)(f)) | Service notices (resets, receipts, alerts) are contract-necessary; operational nudges rely on LI (see LIA below). Sent via Resend. |
| 7 | AI Copilot | **Legitimate interest** (with controls) | Workspace-scoped assistance. See LIA below and `ai-copilot-risk-assessment.md`. No special-category data intentionally processed. |
| 8 | Security & audit logging | **Legal obligation** + **Legitimate interest** | Security monitoring, breach evidence, fraud/abuse prevention. IP/UA retained per retention schedule. |
| 9 | Support | **Contract** + **Legitimate interest** | Handling account queries is contract-adjacent; complaint handling/quality relies on LI. |
| 10 | Marketing / newsletter | **Consent** (Art. 6(1)(a)) + PECR | Opt-in only; withdrawable; suppression list retained. Consent capture + Turnstile is build item A4 (pending). |
| 11 | Data rights requests | **Legal obligation** | Handling SAR/erasure/portability and evidencing compliance. |

## Legitimate Interest Assessments (LIA summaries)

A documented LIA has three parts: **purpose** (is the interest legitimate?),
**necessity** (is processing needed?), **balancing** (does it override the
individual's rights?). Summaries below; full LIAs to be expanded at legal review.

### LIA-1 — AI Copilot (activity 7)
- **Purpose:** help operators work faster within their own workspace data.
- **Necessity:** the assistant must read live workspace counts/records to be
  useful; this is the minimum data needed (head-count snapshots, not bulk export
  — see `workspace-context.ts`).
- **Balancing:** processing is strictly workspace-scoped under the caller's
  RLS-bound client; no cross-workspace access; no model training on API data per
  provider terms (verify current OpenAI terms); rate/cost metered; output carries
  a "not final advice" disclaimer. On balance LI is appropriate. Marketing-style
  AI use of personal data would require a different basis.

### LIA-2 — Operational transactional email (activity 6)
- **Purpose:** keep operators informed of relevant workspace events.
- **Necessity:** email is the established channel; content references only.
- **Balancing:** low intrusion, expected by users, easy to control via
  notification preferences. Purely promotional email is excluded and runs under
  **consent** (activity 10), not LI.

### LIA-3 — Security & audit logging (activity 8)
- **Purpose:** protect the service and its users; meet accountability duties.
- **Necessity:** action/IP/UA records are needed to detect abuse and evidence
  breaches.
- **Balancing:** access-controlled, retention-limited (12–24 months), minimised
  — outweighs the limited privacy impact. Overlaps with legal obligation.

## Withdrawal & objection
- **Consent** (marketing) can be withdrawn any time (unsubscribe + suppression).
- **Legitimate interest** processing can be **objected to** (Art. 21); objections
  are handled per `sar-and-data-rights-runbook.md`.
- **Contract** and **legal obligation** bases cannot be withdrawn while the
  account/obligation persists, but the account can be closed (erasure subject to
  the financial/audit exceptions in `retention-schedule.md`).

> **Legal review required.** Engineering-prepared draft. Confirm bases and expand
> the LIAs with a qualified data protection adviser before external reliance.
