# International Transfer Assessment (Transfer Impact Assessment)

Controller: Blackwellen Ltd (Propvora), Company No. 16482166, ICO ZC160806.
Contact: legal@propvora.com.

This Transfer Impact Assessment (TIA) covers transfers of personal data outside
the UK under UK GDPR Chapter V. It expands the summary in
`subprocessor-register.md`. The transfer mechanism for US processors is the
**UK International Data Transfer Addendum (IDTA)** to the EU Standard Contractual
Clauses, or the relevant provider's UK-extended SCCs, plus the supplementary
measures below.

## Transfer posture
- **Preferred:** host primary data (Supabase DB/auth/RLS, Cloudflare R2 objects)
  in **UK/EU** regions. Confirm and document the Supabase project region and the
  R2 bucket jurisdiction (open action — see `subprocessor-register.md`).
- **Unavoidable US transfers:** Stripe, Resend, OpenAI, Vercel. Each is minimised
  and contractually safeguarded.

## Per-processor assessment

| Processor | Purpose | Personal data transferred | Destination | Mechanism | Supplementary measures |
|-----------|---------|---------------------------|-------------|-----------|------------------------|
| **Stripe** | SaaS billing (+ Connect, off) | Stripe customer/subscription ids, billing metadata. **No card data held by us.** | US / global | Stripe DPA + SCCs/UK addendum; PCI DSS | Tokenised; HTTPS in transit; minimal ids only; webhook signature-verified. |
| **Resend** | Transactional + (future) marketing email | Email address, message content/refs | US | Resend DPA + SCCs/UK addendum | Content minimised to what the email needs; TLS; domain auth (SPF/DKIM/DMARC) pending (X4). |
| **OpenAI** | AI Copilot (gpt-4o-mini) | User prompt text + workspace **counts** (no bulk record bodies) | US | OpenAI DPA + SCCs/UK addendum | Minimised payload (see `ai-copilot-risk-assessment.md`); provider states no training on API data (**verify current terms**); TLS; server-only keys. |
| **Vercel** | Hosting / edge | Request data, logs (may include IP/UA) | US / global edge | Vercel DPA + SCCs/UK addendum | TLS; no app secrets in logs; error pages strip stack traces (item 47–48 pending). |
| Supabase | DB/auth/storage | All app personal data | EU/UK region (configure) | DPA; SCCs/UK addendum if any US sub-processing | RLS on all 229 tables; encryption at rest/in transit. |
| Cloudflare (R2) | Private file storage | Documents, evidence photos | Configurable region; global edge | DPA; SCCs/UK addendum | Private buckets; proxied/authed access only. |

## Risk evaluation (US destinations)
- **Government access risk (e.g. FISA 702):** the principal residual risk for US
  transfers. Mitigated by **data minimisation** (ids/counts/email rather than rich
  datasets), strong encryption in transit, contractual SCCs/IDTA, and the limited
  sensitivity of the data each US processor receives. The EU–US Data Privacy
  Framework and the UK Extension may further reduce risk where the processor is
  certified — **confirm each provider's current certification status**.
- **Onward transfer:** controlled via each DPA's sub-processor terms; material
  changes notified per the Propvora DPA (`/legal/data-processing`).

## Supplementary measures (summary)
- Technical: encryption in transit (TLS) and at rest; minimisation; pseudonymous
  ids where possible; RLS isolation; server-only secrets.
- Contractual: SCCs + UK IDTA; DPAs on file; sub-processor change notice.
- Organisational: this TIA, the breach runbook, retention limits, access control.

## Open actions
- [ ] File each provider's signed DPA + SCC/IDTA reference (Stripe, Resend, OpenAI, Vercel, Supabase, Cloudflare).
- [ ] Confirm + document Supabase project region and R2 bucket jurisdiction.
- [ ] Verify current OpenAI API data-usage/training terms.
- [ ] Check each US provider's DPF (UK Extension) certification status.

> **Legal review required.** Engineering-prepared draft TIA. A qualified adviser
> must confirm mechanisms, DPF reliance, and supplementary measures before GA.
