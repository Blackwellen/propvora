# Subprocessor Register

Controller/Processor: Blackwellen Ltd (Propvora), ICO ZC160806.
Notice of changes: material subprocessor changes will be notified per the DPA
(`/legal/data-processing`). Contact: legal@propvora.com.

| Subprocessor | Service | Data processed | Location / transfer | Safeguard |
|--------------|---------|----------------|---------------------|-----------|
| Supabase | Database, auth, RLS | All app personal data | EU/UK region (configure project region) | DPA; SCCs/UK IDTA if any US sub-processing |
| Cloudflare (R2) | Private file storage | Documents, evidence photos | Configurable region; Cloudflare global edge | DPA; SCCs/UK IDTA |
| Stripe | Subscription billing (+ Connect, flagged off) | Billing ids, payment metadata (no card data held by us) | US / global | Stripe DPA; SCCs; PCI DSS |
| Resend | Transactional + marketing email | Email address, message content | US | DPA; SCCs |
| OpenAI | AI Copilot (model gpt-4o-mini) | Prompts/responses (workspace-scoped) | US | DPA; SCCs; no training on API data per provider terms (verify current terms) |
| Vercel | Hosting / edge | Request data, logs | US / global edge | DPA; SCCs |
| Companies House API (GOV.UK) | Company lookups | Outbound queries only (no personal data sent in) | UK | Public API; no PII transfer out |
| OpenStreetMap / CartoDB | Map tiles | Coordinates only; no user PII | EU/global | No personal data |

## International transfers (summary TIA)
- Preferred posture: host primary data (Supabase, R2) in UK/EU regions.
- US-based processors (Stripe, Resend, OpenAI, Vercel) operate under their DPAs +
  SCCs / UK International Data Transfer Addendum. A full Transfer Impact
  Assessment (`international-transfer-assessment.md`) is a TODO before GA.

## Action items
- [ ] Confirm Supabase project region (UK/EU) and document.
- [ ] Confirm R2 bucket jurisdiction.
- [ ] File each provider's signed DPA reference here.
- [ ] Verify OpenAI current data-usage/training terms for API tier.
