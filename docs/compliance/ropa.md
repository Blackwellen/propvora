# Record of Processing Activities (Art. 30 UK GDPR)

Controller: Blackwellen Ltd (Propvora), ICO ZC160806. DPO/contact: legal@propvora.com.

| # | Processing activity | Purpose | Lawful basis | Data subjects | Data categories | Recipients/processors | Retention |
|---|---------------------|---------|--------------|---------------|-----------------|----------------------|-----------|
| 1 | Account registration & auth | Provide the service | Contract | Users | Identity, credentials | Supabase | Life of account + 30d grace |
| 2 | Workspace operations (portfolio, tenancies, jobs, money) | Deliver core features | Contract / legitimate interest | Users, tenants, suppliers | Operational + contact data | Supabase, R2 | Per retention schedule |
| 3 | Contact management | Let operators manage their relationships | Legitimate interest (operator is controller of their contacts; Propvora is processor) | Tenants, landlords, suppliers | Contact details | Supabase | Until deleted by operator |
| 4 | Billing & subscriptions | Take payment for the service | Contract | Account owners | Billing ids, plan state | Stripe | Statutory (6 yrs financial) |
| 5 | Owner payouts via Connect (flagged OFF) | Let owners receive tenant payments | Contract | Account owners | Connected account id/status | Stripe Connect | While connected + statutory |
| 6 | Transactional email | Service notifications | Contract / legitimate interest | Users | Email, content refs | Resend | Email log per retention |
| 7 | AI Copilot | Assist users within their workspace | Legitimate interest (with controls) + consent where required | Users | Prompts/responses, metering | AI provider (OpenAI) | Metering retained; content per retention |
| 8 | Security & audit logging | Protect the service | Legal obligation / legitimate interest | Users, admins | Action, IP, UA | Supabase | Security retention |
| 9 | Support | Handle queries/complaints | Contract / legitimate interest | Users | Ticket content | Supabase, Resend | Support retention |
| 10 | Marketing/newsletter | Product updates | Consent | Subscribers | Email | Resend | Until unsubscribe |
| 11 | Data rights requests | Comply with UK GDPR | Legal obligation | Users | Request metadata | Supabase | As required to evidence compliance |

**Roles:** For an operator's own business/contact/tenant data, the operator is the
**controller** and Blackwellen Ltd is the **processor** (a DPA is provided —
`/legal/data-processing`). For account, billing, security and marketing of the
Propvora service itself, Blackwellen Ltd is the **controller**.

**International transfers:** see subprocessor-register.md (UK/EU hosting preferred;
SCCs/UK IDTA where a processor operates outside the UK/EEA).
