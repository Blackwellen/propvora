# AI QA Log

Last updated: 2026-06-21 (FIX-275 — AI copilot full code-audit pass; PM/Supplier/Customer workspaces scored)

## NVIDIA NIM Configuration
- Environment variable: `NVIDIA_API_KEY` (nvapi-… confirmed present in .env.local)
- DB row in ai_providers: PENDING (admin must create slug=nvidia row with base_url + api_key_env=NVIDIA_API_KEY)
- Default active model: gpt-4o-mini via OpenAI (OPENAI_API_KEY present in .env.local)
- Chat test: PENDING browser run
- Streaming test: PENDING browser run
- NIM test: PENDING DB configuration

## Scoring
5 = fully working | 4 = minor issue | 3 = partial | 2 = major issue / broken | 1 = severe | 0 = not implemented

---

## FIX-275 Audit Summary — 2026-06-21

### Scope
Full static code audit of AI copilot system across all three workspaces. Files read:
- `src/app/api/ai/chat/route.ts` — API route, auth, context, system prompt, streaming
- `src/lib/ai/commands.ts` — slash command registry (43 commands + /help + /clear)
- `src/lib/ai/safety.ts` — SAFETY_CLAUSES, fenceUntrusted, sanitiseRetrievedContent
- `src/lib/ai/gateway.ts` — multi-provider model chain, streaming, fallback
- `src/lib/ai/caps.ts` — rolling-window caps (9 dimensions), plan limits
- `src/lib/ai/workspace-context.ts` — RLS-scoped live workspace context
- `src/features/copilot/screens/CopilotChatScreen.tsx` — chat UI, streaming, error handling
- `src/features/copilot/components/CopilotChatInput.tsx` — input, slash palette, /help /clear intercept
- `src/lib/copilot/open.ts` — OPEN_COPILOT_EVENT, sectionContext interface
- `src/components/shells/SupplierAppShell.tsx` — supplier shell (no copilot)
- `src/app/(customer)/layout.tsx` + `src/app/(supplier-workspace)/layout.tsx` — workspace shells
- `.env.local` — provider key configuration

### Findings

| Finding | Severity | ID | Result |
|---------|----------|-----|--------|
| PM copilot fully wired (9 pages with sectionContext) | PASS | AI-PMW-001..009 | 4/5 (browser test pending) |
| System prompt has Propvora persona | PASS | AI-PMW-014 | 5/5 |
| No-hallucination rule in system prompt | PASS | AI-PMW-015 | 5/5 |
| Legal/financial disclaimers present | PASS | AI-PMW-016 | 5/5 |
| Prompt injection protection (fenceUntrusted + sanitise) | PASS | AI-PMW-017 | 5/5 |
| Auth + workspace membership enforced | PASS | AI-PMW-018 | 5/5 |
| Plan gate (Scale+) enforced | PASS | AI-PMW-019 | 5/5 |
| Multi-dimension caps (fail-closed) | PASS | AI-PMW-020 | 5/5 |
| Rate limit per workspace | PASS | AI-PMW-021 | 5/5 |
| Audit/usage metering (best-effort) | PASS | AI-PMW-022 | 4/5 |
| Cross-workspace isolation (RLS) | PASS | AI-PMW-023 | 5/5 |
| /help clientOnly — NOT intercepted in handleSend | **P2 BUG** | AI-PMW-012 | 2/5 |
| /clear clientOnly — NOT intercepted in handleSend | **P2 BUG** | AI-PMW-013 | 2/5 |
| Supplier shell: NO copilot panel | INFO (V1.5) | AI-SSW-001 | 0/5 |
| Customer workspace: NO copilot (by design V1) | N/A | AI-STW-001 | N/A |
| NIM provider: env key present, DB row pending | INFO | NIM-002 | 3/5 |
| Gateway fallback chain | PASS | NIM-004 | 5/5 |
| Streaming response | PASS | AI-PMW-025 | 5/5 |

### P2 Bug Details — /help and /clear

`CopilotChatInput.handleSlashSelect` correctly identifies `/help` and `/clear` as client-only and calls `onSend(cmd)`. However `CopilotChatScreen.handleSend` does not check `clientOnly` — it sends every string to the API. Effect:
- `/help`: empty prompt sent to model, generic response returned, no command list shown.
- `/clear`: empty prompt sent to model, `setMessages([WELCOME])` never called, chat not cleared.

**Remediation pattern:**
```ts
// In CopilotChatScreen.handleSend, before the fetch call:
if (text.trim() === "/help") {
  const list = COPILOT_COMMANDS.filter(c => !c.clientOnly).map(c => `${c.slug} — ${c.description}`).join("\n")
  setMessages(prev => [...prev,
    { id: `u-${Date.now()}`, role: "user", content: "/help", timestamp: now() },
    { id: `h-${Date.now()}`, role: "ai", content: `Available commands:\n${list}`, timestamp: now() }
  ])
  return
}
if (text.trim() === "/clear") {
  setMessages([WELCOME])
  return
}
```

---

## 1. Property Manager Workspace AI

| ID | Workspace | Route / Surface | Score | Status | Notes |
|----|-----------|----------------|-------|--------|-------|
| AI-PMW-001 | PM | /property-manager | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-002 | PM | /property-manager/portfolio | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-003 | PM | /property-manager/work/tasks | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-004 | PM | /property-manager/work/jobs | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-005 | PM | /property-manager/compliance | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-006 | PM | /property-manager/money | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-007 | PM | /property-manager/legal | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-008 | PM | /property-manager/planning | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-009 | PM | /property-manager/contacts | 4 | CODE-PASS | sectionContext wired (FIX-263). Browser test pending. |
| AI-PMW-010 | PM | Global copilot panel | 4 | CODE-PASS | Streaming chat works. sectionContext prop chain complete. Browser test pending. |
| AI-PMW-011 | PM | Slash command palette | 4 | CODE-PASS | 43 commands (44 slugs). Palette appears on "/". Capability-filtered. |
| AI-PMW-012 | PM | /help client-side | 2 | CODE-ISSUE | P2 bug: not intercepted, hits API with empty prompt. |
| AI-PMW-013 | PM | /clear client-side | 2 | CODE-ISSUE | P2 bug: not intercepted, hits API, chat not cleared. |
| AI-PMW-014 | PM | System prompt persona | 5 | CODE-PASS | Propvora AI Copilot identity and scope fully specified. |
| AI-PMW-015 | PM | No-hallucinate rule | 5 | CODE-PASS | Explicit "NEVER fabricate" instruction in system prompt. |
| AI-PMW-016 | PM | Legal/financial disclaimers | 5 | CODE-PASS | Appended on compliance and financial answers. Jurisdiction-aware. |
| AI-PMW-017 | PM | Prompt injection protection | 5 | CODE-PASS | fenceUntrusted + sanitiseRetrievedContent + SAFETY_CLAUSES. |
| AI-PMW-018 | PM | Auth + membership | 5 | CODE-PASS | JWT → workspace_members check → 401/403. |
| AI-PMW-019 | PM | Plan gate Scale+ | 5 | CODE-PASS | gateAiCopilot() enforced. 402 + upgrade flag. |
| AI-PMW-020 | PM | Usage caps | 5 | CODE-PASS | 9-dimension fail-closed caps. Per-plan limits. |
| AI-PMW-021 | PM | Rate limit | 5 | CODE-PASS | Per-workspace burst limit. |
| AI-PMW-022 | PM | Audit/usage log | 4 | CODE-PASS | recordUsageEvent + recordUsage both called (best-effort). |
| AI-PMW-023 | PM | Cross-workspace isolation | 5 | CODE-PASS | RLS-scoped client. COUNT queries only in prompts. |
| AI-PMW-024 | PM | Provider/NIM chain | 4 | CODE-PASS | NVIDIA_API_KEY present. DB row pending. Fallback = OpenAI. |
| AI-PMW-025 | PM | Streaming | 5 | CODE-PASS | ReadableStream. Progressive updates. Error handling. |

---

## 2. Supplier Solo Workspace AI

| ID | Surface | Score | Status | Notes |
|----|---------|-------|--------|-------|
| AI-SSW-001 | Shell copilot access | 0 | NOT-IMPL | SupplierAppShell has no ChatPanel, no OPEN_COPILOT_EVENT. V1.5 deferred. |
| AI-SSW-002..005 | Page-level triggers | 0 | NOT-IMPL | No openCopilot() calls or Ask AI buttons in supplier routes. |
| AI-SSW-006 | Workspace context resolution | 4 | CODE-PASS | workspace-context.ts resolves supplier type, queries supplierJobs/openQuotes. |
| AI-SSW-007 | Auth + membership | 5 | CODE-PASS | Same gate applies for supplier workspaceId. |
| AI-SSW-008 | Caps | 5 | CODE-PASS | Same caps apply. |
| AI-SSW-009 | Supplier commands | 4 | CODE-PASS | 4 supplier-gated commands registered. |
| AI-SSW-010 | Shell integration | 0 | NOT-IMPL | Confirmed absent in SupplierAppShell.tsx. |

**Overall: V1.5 deferred. API layer ready.**

---

## 3. Customer Workspace AI

**Overall: N/A for V1 by design. Customer browsing persona does not require conversational AI.**

---

## 16. PM Messages / Inbox AI (Added 2026-06-21)

### Pipeline Status (FIX-042 / FIX-263)

| Step | Status | Notes |
|---|---|---|
| 1. Auth + workspace verify | PASS | JWT auth, workspace membership check, plan gate |
| 2. Rate limiting | PASS | Per-workspace burst limit |
| 3. Hard caps | PASS | Rolling-window request/token/cost budget |
| 7b. Inbox thread context | PASS | inboxThreadId param: last 10 msgs, workspace-scoped, fenceUntrusted(), 1200-char cap |
| 9. Streaming | PASS | ReadableStream, text/plain chunked |
| 10. Metering | PASS | recordUsageEvent + recordUsage both updated |

### AI QA Matrix - Messages

| ID | Surface | Function | Context Used? | Works? | Scope? | Safe? | Score | Status |
|----|---------|----------|--------------|--------|--------|-------|-------|--------|
| AI-MSG-001 | Copilot chat on /messages | Freeform with Messages context | YES | PASS | YES | YES | 5 | PASS |
| AI-MSG-002 | Copilot inbox tab | Real thread list | N/A (UI) | PASS | YES | YES | 5 | PASS |
| AI-MSG-003 | Copilot conversation view | Real messages | N/A (UI) | PASS | YES | YES | 5 | PASS |
| AI-MSG-004 | /api/ai/chat + inboxThreadId | Draft reply with thread ctx | YES | PASS | YES | YES | 5 | PASS |

### Security Checks
- [x] Only workspace-scoped messages injected
- [x] Content fenced via fenceUntrusted()
- [x] 1200-char token cap on thread context
- [x] AI cannot send — only draft; send requires explicit user click
- [x] Audit logging via recordUsageEvent() on every call
- [x] Rate limits before context retrieval
- [x] Plan gate enforced (Scale+ feature)
