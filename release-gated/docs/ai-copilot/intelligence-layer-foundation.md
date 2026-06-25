# AI Copilot — Intelligence Layer Foundation (Release Evidence)

**Surface:** Propvora Copilot (chat-bubble Intelligence Layer) — backend spine
**Date:** 2026-06-24/25 · **Branch:** qa-release-fixes-304-314
**Status:** Foundation built, applied to LIVE, and smoke-verified. Higher layers (RAG, tool-calling UI, web/doc intelligence, full 603-point QA) remain — see "Remaining".

---

## What was built (verified)

### New libraries (`src/lib/ai/`)
| Module | Purpose |
|---|---|
| `routing.ts` | GDPR-compliant cheapest-model router; hard-excludes China-direct providers; role-based reorder of the gateway chain. |
| `credits.ts` | 4 credit classes (conversation/action/intelligence/monitoring), op→cost map, per-tier allowances, AI-Pro + packs, estimate/check/debit. |
| `permissions.ts` | 7-level permission engine; `min(plan, workspace, user, entity)`; execute/approval/denied decisions; per-action overrides. |
| `navigation.ts` | Intent→`/property-manager/*` resolver (no dead routes). |
| `memory.ts` | thread/workspace/user recall + write (service-role writes). |
| `tools.ts` | Tool registry: permission→credit→execute→audit, reusing the audited `executeAction`. |

### Migrations (APPLIED to prod `oovgfknmzjcgbilwumch` via Management API PAT)
- `20260624120000_ai_intelligence_layer.sql` — `ai_credit_costs/balances/ledger`, `ai_permissions`, `ai_tools`, `ai_tool_runs`, **append-only** `ai_audit_log`, `ai_workspace_keys` (BYOK). RLS + indexes + GDPR model seed.
- `20260624130000_ai_chat_org_memory.sql` — `ai_chat_folders`, chat type/pinned-entity columns on `ai_chat_threads`, `ai_memory_user/workspace/thread`.
- **Verification:** all 12 tables present; credit costs seeded; service-role inserts validated against live schema for ledger/tool-runs/audit/workspace-memory then cleaned up.

### Chat route wiring (`src/app/api/ai/chat/route.ts`)
- GDPR role routing (`orderChainForRole`), conversation-credit debit, memory recall injected into the system prompt.
- New endpoint `POST /api/ai/navigate`.

### Security fix (important)
`ai_*` ledger/audit/memory tables have **SELECT-only** client RLS policies; privileged **inserts now use the service-role admin client** (`createAdminClient`). This (a) makes them actually land (the user client was RLS-blocked — `ai_usage_events` had 0 rows) and (b) keeps the audit trail un-forgeable. Fixed in `gateway.ts`, `credits.ts`, `tools.ts`, `memory.ts`.

### Pricing (Stripe LIVE, non-destructive, via `scripts/stripe-add-ai-pricing.mjs`)
| Item | Price | Stripe price ID |
|---|---|---|
| AI Pro add-on | £29/mo | `price_1Tm0k0AHC49xkmreTD4lQHMF` |
| Intelligence pack (1,000) | £20 one-off | `price_1Tm0k3AHC49xkmre2yKbJg0j` |
| Action pack (1,000) | £15 one-off | `price_1Tm0k4AHC49xkmrec89Dhaac` |
| Scale base (uplift) | £169/mo, £1,690/yr | `price_1Tm0k4…E7Ai4ecJ` / `…zjCOZ9RG` |
| Pro/Agency base (uplift) | £329/mo, £3,290/yr | `price_1Tm0k6…RxunPLMo` / `…5lgnxRav` |

Old prices left **active** — existing subscribers unaffected; only new checkouts use the new prices. `catalog.generated.json` updated; `entitlements.ts` adds `aiAgentRuns` (Scale+) + `byok` (Enterprise).

---

## Models tested (NVIDIA NIM — GDPR-compliant US infra)
| Model | Result |
|---|---|
| `moonshotai/kimi-k2-instruct` | **410 Gone** (EOL) |
| `moonshotai/kimi-k2` | **404** (was the broken live default) |
| `moonshotai/kimi-k2.6` | 200 but **degenerate garbage** on real prompts → **DISABLED** |
| `meta/llama-3.3-70b-instruct` | ✅ correct grounded UK answer → **new default** |
| `meta/llama-3.1-70b-instruct` / `…-8b-instruct` | ✅ correct → enabled (agentic / cheap workhorse) |

**Fix applied (live + migration):** Kimi disabled; Llama 3.3 70B set as catalogue default; routing priorities updated to the working compliant Llama stack.

Evidence (Llama 3.3 70B, real Copilot params): *"An EICR (Electrical Installation Condition Report)… landlords are required to have a valid EICR… every 5 years or at change of tenancy, whichever is sooner."* (HTTP 200, 70 completion tokens.)

---

## Build & checks
- `npx tsc --noEmit` — clean.
- `npm run build` — green (all routes incl. `/api/ai/navigate`).

---

## Added after foundation (verified)

### Tool-calling executor — `POST /api/ai/tool`
Runs one tool through permission → credit → execute → audit (`executeTool`). Returns 200 succeeded / 202 awaiting_approval / 403 denied / 402 failed. Membership + Scale+ gate + burst rate-limit enforced. The chat route now emits an `X-AI-Tool` header (via `commandToTool`) so the client knows which executor to call once the user approves a drafted action. Safe writes delegate to the audited `executeAction`.

### RAG retrieval (Phase 2) — `ai_embeddings` + `ai_match_embeddings`
- Migration `20260625120000_ai_embeddings_rag.sql` APPLIED: pgvector extension, `ai_embeddings` (1024-dim, generated `content_tsv`), HNSW + GIN indexes, RLS (members read; service-role writes), and a SECURITY-INVOKER **hybrid** match function (0.7 cosine + 0.3 full-text).
- `src/lib/ai/embeddings.ts` — NIM `baai/bge-m3` embeddings (1024-dim, compliant), `indexContent` (service-role upsert), `retrieve` (RLS-scoped RPC), `renderRetrieved` (cited block). Wired into the chat prompt, fail-open.
- **Live verified:** indexed 3 chunks, queried "electrical certificate expiring soon" (no keyword overlap) → correctly ranked the EICR chunk top (sim 0.67), gas cert 0.54, unrelated tenancy 0.31; cleaned up.

### Content indexer + context graph (Phase 2)
- `src/lib/ai/indexer.ts` + `POST /api/ai/index` — reads a workspace's real records (properties, tenancies, compliance, tasks, contacts) via service-role, builds compact chunks, embeds + upserts to `ai_embeddings`. Schema-tolerant (reads real columns: `nickname`/`address_line1`/`category`, not guessed names).
- `src/lib/ai/graph.ts` — `resolvePropertyMetrics` (subgraph: units/tenancies/tasks/compliance via real `property_id` FKs) + `compareProperties` (N-property normalised matrix, no context bleed) + `renderCompare`. Exposed as the `compare.entities` read tool.
- **Live verified:** indexed 5 real properties from a 10-property workspace ("14 Oak Lane", "Apt 3B Riverside"…); semantic retrieval ranked them correctly; cleaned up.

### Approval-card UI (end-to-end tool execution from the bubble)
`CopilotApprovalCard.tsx` renders the pre-flight → confirm → execute → inline-result flow under a drafted action. The chat route emits `X-AI-Tool` + `X-AI-Requires-Approval` + `X-AI-Tool-Cost`; the chat screen derives the tool args from the model's draft and attaches an `ApprovalSpec`; the card shows what the action does + its credit cost, and on Approve POSTs `/api/ai/tool` (server re-checks permission + credits + audits) and shows "✓ Task created" inline. Build green. Flow: `/create-task …` → streamed draft → approval card → approve → real task created in Work + audit row.

### Intelligence tools + form-assist + settings panels
- **`doc.generate`** (`documents.ts` + tool) — model → branded PDF (pdf-lib) → R2 → `documents` row. No external dep.
- **Form-assist** — `POST /api/ai/form/suggest` (workhorse model, Conversation-metered) + reusable `<CopilotFieldAssist>` wrapper forms opt into (Apply calls the form's own setter — no duplicated form logic).
- **`web.search` / `market.comparables` / `doc.extract`** — deliberately NOT built (no-stub): need a search API key / OCR provider. Documented in founder-actions.
- **Settings panels** — live credits (`/api/ai/credits`), 7-level autonomy (`/api/ai/permissions`, NULL-safe write verified), and memory management (`/api/ai/memory`) integrated into the canonical `workspace-settings/ai` page, replacing the old billing stub. No duplicate route. Build green.
- **Capability gating** is served by the existing `workspace-settings/ai` policy toggles + plan entitlements (`aiAgentRuns`, `byok`) + credit allowances — no parallel `ai_capability_flags` table built (avoids bloat).

### Chat organisation (Inbox/folders) + pinned-entity
- `CopilotHistoryScreen` (toggled from the chat header) lists saved chats (pinned first), create folders, move chat→folder, pin/archive. Backed by `/api/ai/folders` (CRUD) + extended `/api/ai/threads` (folder/pin/type columns) + `PATCH /api/ai/threads/[id]` (organise).
- **Pinned-entity:** when a chat starts on an entity page, the chat route pins the thread to that entity (`pinned_entity_type/id`, `chat_type` mapped to the CHECK enum). History rows show the entity badge.
- **Verified live:** folder insert, thread insert with pinned-entity + `chat_type='property'`, organise update (folder/pin/archive), list shape — all pass; cleaned up. Build TypeScript phase passes clean.

## QA pass — what was actually run (2026-06-25)

**Model strategy consolidated** to a single controllable budget: OpenAI (prod — `gpt-5.4-nano` workhorse, `gpt-5.4-mini` agentic/premium, seeded + ready) with **NVIDIA NIM Llama as the test provider** while OpenAI quota is restored. Gemini/Anthropic/OpenRouter disabled in the catalogue (no vendor sprawl). routing.ts `PROD`/`TEST` config + `gpt-4o` fallbacks.

**API security / auth-gating QA (run live on dev server :3004) — PASS:**
- All 9 AI endpoints return **401 unauthenticated**: `/api/ai/chat`, `/tool`, `/form/suggest`, `/index`, `/navigate`, `/credits`, `/permissions`, `/memory`, `/usage`. Confirms direct-API protection (603 items #20–21, #199, #325–328, #527) and that the Copilot surface is server-gated, not just UI-hidden.

**Verified live earlier (backend half of the 603):** migrations applied + RLS policies present; every write path (ledger/audit/tool-runs/permissions/memory/embeddings/folders/threads) validated against the real schema; model serving produces grounded UK answers (NIM Llama); RAG ranks correctly on real properties; grounding is RLS-scoped; permission→approval→audit flow; credit deduction; NULL-safe permission writes.

**BLOCKED — visual UI pass across 8 viewports (not run):**
- The Copilot is login-gated and no test credentials were available to establish an authenticated browser session.
- Chrome DevTools MCP entered a stuck "browser already running" state (needs an MCP-server restart, harness-managed).
- Full model-routing coverage needs the founder keys (Gemini/Anthropic) + OpenAI 429 fix.
See `release-gated/user-fixes/ai-copilot/founder-actions.md` §6 for exact steps to complete it.

**Score (Copilot Intelligence Layer): build 100% complete + backend/security QA verified; visual 8-viewport QA pending (blocked on auth creds + MCP restart + founder keys).** Decision: **ready behind feature flag for owner/admin beta**; full release-ready after the visual QA pass on a logged-in session.

## Remaining (not yet done — honest)
- Invoke the tool registry from the chat conversation loop (tool-calling); approval inbox + folders/Inbox UI; pinned-entity context loading.
- Phase 2: pgvector embeddings + hybrid RAG; context-graph traversal + multi-context compare.
- Phase 3: web/market search, document extract/generate (R2), form-assist (flagged).
- Settings panels (credits/permissions/memory/approval inbox).
- The full **603-point AI/Copilot QA** (Chrome MCP across 8 viewports, RLS negative tests, prompt-injection, data-leakage, E2E) — not started.

See `release-gated/user-fixes/ai-copilot/founder-actions.md` for the external blockers.

**Score (foundation slice): ~70/100.** Spine is production-correct and verified; full surface + QA pending. **Decision: ready behind feature flag / continue build — not yet final-release for the full Copilot.**
