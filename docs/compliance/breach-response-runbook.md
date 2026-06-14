# Breach Response Runbook

Controller: Blackwellen Ltd (Propvora), ICO ZC160806.
Security inbox: support@propvora.com · Legal: legal@propvora.com.

UK GDPR Art. 33/34: notify the ICO within **72 hours** of becoming aware of a
personal data breach (unless unlikely to risk individuals' rights), and notify
affected individuals without undue delay where the risk is high.

## Severity
| Sev | Example |
|-----|---------|
| Critical | Confirmed exposure of personal data across workspaces; credential dump; ransomware |
| High | Single-workspace data exposure; lost device with access; vendor breach affecting us |
| Medium | Limited internal mis-access, contained quickly; suspected but unconfirmed exposure |
| Low | Near-miss; no personal data affected |

## Steps (incident lead owns the clock)
1. **Detect & record** — open an incident entry (time discovered, reporter,
   systems, suspected data). Start the 72h clock at "awareness".
2. **Contain** — revoke keys/sessions, disable affected access, isolate systems,
   enable maintenance mode if needed (TODO flag).
3. **Assess** — what data, whose, how many, likelihood & severity of harm.
4. **ICO decision** — if risk to individuals: notify ICO within 72h
   (ico.org.uk / 0303 123 1113). Document the reasoning if NOT notifying.
5. **Notify individuals** — if high risk, inform affected users clearly:
   what happened, likely consequences, what we're doing, what they should do.
   (Template lives with the email templates / announcements system.)
6. **Eradicate & recover** — fix root cause, rotate secrets, restore from clean
   backup if needed (see DR plan), verify integrity + RLS after restore.
7. **Post-incident review** — timeline, root cause, corrective actions, owner,
   due dates. Update controls and this runbook.

## Evidence to keep
Incident record, decisions (incl. not-to-notify rationale), comms sent, remediation.
Store access-controlled; minimise personal data in the record itself.

## Contacts / escalation
- Incident lead: Founder (Blackwellen Ltd) until a named DPO is appointed.
- Processors to contact if implicated: Supabase, Cloudflare, Stripe, Resend, Vercel, OpenAI.
- ICO: https://ico.org.uk/for-organisations/report-a-breach/
