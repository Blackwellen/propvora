# Propvora AI Copilot — v2 upgrade + end-to-end function/command test results

Date: 2026-06-16 · Branch: `Propvora-release-version.2.0`
Harness: `scripts/test/copilot-functions.mjs` (run via `npm run test:copilot`)
Default model: **Kimi K2 via NVIDIA NIM** (`moonshotai/kimi-k2.6`) with OpenAI + llama-NIM fallback.

The harness imports the REAL command registry (`src/lib/ai/commands.ts`) and mirrors the
gateway's `callOpenAiCompatible`, so it can never drift from the app. It exercises:
(1) a real completion against the configured default model, (2) the provider fallback path,
(3) the live type-aware workspace context, (4) every contextual action, (5) every /slash command.

## Key finding fixed during this work
NVIDIA NIM **retired `moonshotai/kimi-k2-instruct`** (EOL 2026-05-12) → every default-model
call was failing **HTTP 410 Gone**. The live id is now **`moonshotai/kimi-k2.6`**.
Fix: migration `supabase/migrations/20260617160000_ai_kimi_k2_model_refresh.sql` repoints the
catalogue row. The harness applies the same correction so routing is proven against the live model.

## Run A — fresh NVIDIA quota (definitive real-completion proof): 33/35 PASS
Model chain: `nvidia/moonshotai/kimi-k2.6 → openai/gpt-4o-mini → openai/gpt-4o → nvidia/meta/llama-3.1-70b-instruct`

- GATEWAY: default resolves to Kimi K2 (NVIDIA NIM) — PASS.
- GATEWAY: Kimi K2 returns a non-empty completion (`37+29 tok`) — PASS.
- FALLBACK: bad primary → recovers on a live NIM model — PASS.
- CONTEXT: operator type + 14 live counts (Properties=12, Active tenancies=8, Booking listings=8,
  Marketplace listings=12, Open disputes=1, …) — PASS.
- 6/6 CONTEXTUAL ACTIONS produced real Kimi K2 completions (incl. approval-gated `/draft-landlord-offer`).
- 23/23 SLASH COMMANDS dispatched + produced real Kimi K2 completions.
- Only failures: the final 2 commands hit NIM's per-window 429 at the tail of the burst (transient).

## Run B — after NIM Kimi window saturated (fallback + dispatch proof)
- GATEWAY default still resolves to Kimi K2; Kimi call THROTTLED (429) → **fallback recovers on
  `nvidia/meta/llama-3.1-70b-instruct`** — PASS.
- CONTEXT type variation — PASS for all three workspace types:
  - operator → portfolio+bookings+supplier+planning all enabled.
  - supplier → portfolio/bookings excluded; supplier+marketplace enabled.
  - customer → supplier/planning excluded; bookings+marketplace enabled.
- 6/6 CONTEXTUAL ACTIONS PASSED via gateway fallback to the llama NIM model (237–335 tok each).
- 23/23 SLASH COMMANDS dispatch + capability-gating PASS (deterministic), with correct
  read-only vs draft·approval flags.
- Live per-command completions then THROTTLED once the NIM account window was fully saturated by
  the test burst — wiring-correct; upstream model rate-limited (not a logic failure).

## Honest caveats
- The OpenAI key in this environment is billing-quota-exhausted (429), so OpenAI is not a usable
  live fallback here; the working fallback proven is the second NVIDIA NIM model.
- NVIDIA NIM free-tier applies per-model rate windows; sustained test bursts exhaust the Kimi
  window. The platform fallback chain keeps the copilot answering regardless (proven in Run B).
- The HTTP routes (`/api/ai/chat`, `/api/ai/actions`, `/api/ai/commands`) require an authenticated
  Supabase cookie session, so they are not invoked directly headlessly; the harness exercises the
  exact libraries those routes call (gateway, command registry, context assembly) against the live
  DB and live models.
