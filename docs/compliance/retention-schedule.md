# Retention Schedule

Controller: Blackwellen Ltd (Propvora), ICO ZC160806.

## Principles
- Keep personal data only as long as needed for the purpose or as law requires.
- Soft-delete (`deleted_at`) then hard-delete/anonymise per the classes below.
- Erasure requests honoured subject to legal retention (see exceptions).

## Retention classes

| Class | Data | Retention | Mechanism |
|-------|------|-----------|-----------|
| Account | Profile, auth | Life of account + **30-day** grace after deletion request | `account_deletion_requests` (30d `scheduled_for`) → erasure worker |
| Operational | Properties, units, tenancies, jobs, contacts, documents | Until deleted by the operator, or account erasure | Soft-delete + cascade on workspace erasure |
| Financial (SaaS) | Invoices, payment records, subscription history | **6 years** (UK tax/accounting) | Retained even after account closure (legal obligation) |
| Files (R2) | Documents, evidence photos | With parent record; purged on erasure | R2 object delete + metadata delete |
| Communications | Portal messages, support tickets | 2 years after closure (review) | Scheduled purge |
| AI metering | Token usage, cost | 24 months (billing/abuse) | Rollup tables |
| AI content | Prompts/responses | Minimised; deleted with thread/account | `ai_chat_*` cascade |
| Security/audit | Audit logs, security events | 12–24 months (security/legal) | Retained, access-controlled |
| Marketing | Newsletter subscription | Until unsubscribe + suppression | Suppression list retained |
| Rate-limit/abuse | IP-derived counters | Short-lived (rolling window) | Auto-expiry |
| Backups | DB/storage backups | Provider backup window (see DR plan) | Time-boxed; restorable |

## Exceptions to erasure
Financial records and certain audit/security logs are retained where required by
law or to defend legal claims, even after an erasure request — the rest of the
subject's data is erased/anonymised. This is disclosed in the privacy policy.

## Backups note
Erasure removes data from production immediately (soft→hard). Backups age out
within the provider's backup window; data is not restored selectively into a
purged account. Documented in `docs/release/disaster-recovery-plan.md` (TODO).
