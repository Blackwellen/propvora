# Section 14 — AI / Copilot

Last updated: 2026-06-21 (Session 19 — all AI surface rows reconciled to BROWSER_REQUIRED; NIM infrastructure confirmed present in src/lib/ai/nim.ts; usage cap gates confirmed in src/lib/billing/gates.ts)

Coverage for all AI-powered features across PM workspace, Supplier Solo (SSW), Supplier Team (STW), and NVIDIA NIM infrastructure. Each row tests a specific AI surface: trigger, context injection, NIM call, streaming response, usage cap enforcement, security, and audit log entry.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## AI Surface Matrix

| ID | Workspace | Route / Surface | AI Function | Trigger | Context Used? | NIM Works? | Chat Works? | Caps Work? | Security OK? | Audit Log? | Score | Status |
|----|-----------|----------------|-------------|---------|--------------|-----------|------------|-----------|-------------|-----------|-------|--------|
| AI-PMW-001 | PM | /property-manager | Dashboard AI summary | Copilot button | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-002 | PM | /property-manager/portfolio | Portfolio summary | Ask AI button | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-003 | PM | /property-manager/work/jobs | Job summary | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-004 | PM | /property-manager/compliance | Compliance gap analysis | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-005 | PM | /property-manager/money | Rent arrears summary | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-006 | PM | /property-manager/legal | Legal case summary | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-007 | PM | /property-manager/messages | Message draft | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-008 | PM | AI Copilot chat bubble | General workspace chat | Chat bubble | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-009 | PM | /property-manager/planning | Planning explanation | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-PMW-010 | PM | AI usage dashboard | Usage/caps display | Settings | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-SSW-001 | SSW | /supplier | Job summary | AI helper | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-SSW-002 | SSW | /supplier/jobs/[id] | Work order explanation | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-SSW-003 | SSW | /supplier/invoices | Invoice draft | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-SSW-004 | SSW | /supplier/messages | Message draft | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-SSW-005 | SSW | AI chat bubble | General chat | Chat | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-STW-001 | STW | /supplier (team) | Team workload summary | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-STW-002 | STW | /supplier/team | Job assignment suggestion | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AI-STW-003 | STW | /supplier/team/jobs | Team performance | AI action | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| NIM-001 | All | Server/API | NVIDIA NIM connection | API route | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — requires NIM_API_KEY + NIM_BASE_URL env vars set |
| NIM-002 | All | Server/API | NIM model config | ENV vars | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| NIM-003 | All | Server/API | NIM streaming response | API route | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| NIM-004 | All | Server/API | NIM error/fallback | Error handler | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| NIM-005 | All | Server/API | NIM usage recording | Audit | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |

---

## QA Protocol for AI

1. Verify NVIDIA NIM env vars are set (`NIM_API_KEY`, `NIM_BASE_URL`, model config).
2. Trigger each AI surface and confirm: (a) context is passed (workspace/record), (b) NIM API call fires, (c) streaming response appears in UI, (d) usage counter increments, (e) audit log entry created.
3. Exhaust the plan AI cap and confirm UI shows cap-reached state gracefully.
4. Attempt prompt injection in chat input — confirm sanitisation.
5. Confirm AI responses do not leak cross-workspace data.
6. Check `ai_usage_logs` table for accurate token recording.
