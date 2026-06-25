# AI Copilot — Founder/External Actions Required

These are the only Intelligence-Layer items Claude Code could **not** complete from the codebase, with the exact reason and steps.

## 1. Set up Azure OpenAI (EU) — production AI provider (HIGH)
**Decision (2026-06-25):** single production provider = **Azure OpenAI in an EU region** (GPT-5.4 nano + mini). GDPR EU data residency at standard token pricing — **avoids OpenAI's $108k Enterprise data-residency tier entirely**. NVIDIA NIM (Llama) serves until this is set; then Azure takes over automatically (no code change — the router prefers Azure, the gateway only offers keyed models).

**Why Claude can't:** creating the Azure resource + keys is a Microsoft Azure portal action.

**Do this (≈20 min):**
1. Azure Portal → create an **Azure OpenAI** resource in an **EU region** (Sweden Central or France Central) for EU data residency / EU Data Boundary.
2. In **Azure AI Foundry / OpenAI Studio**, create **deployments** named exactly: `gpt-5.4-nano`, `gpt-5.4-mini` (and optionally `gpt-4o-mini`, `gpt-4o` as fallbacks). These names must match the `ai_models.model_id` rows already seeded.
3. Copy the resource **Endpoint** + **Key** (Keys & Endpoint blade).
4. Set env vars (locally in `.env.local`, and in **Vercel → Settings → Environment Variables** for prod):
   - `AZURE_OPENAI_ENDPOINT` = e.g. `https://propvora-eu.openai.azure.com`
   - `AZURE_OPENAI_API_KEY` = the resource key
   - `AZURE_OPENAI_API_VERSION` = the version your resource supports (e.g. `2024-10-21`)
5. Redeploy. The gateway auto-detects the key → Azure GPT-5.4 leads, NIM Llama drops to fallback. No code change.
6. Sign the **Microsoft DPA** + confirm **EU Data Boundary** in your Azure agreement, and disclose Azure OpenAI as a sub-processor in your privacy policy/ROPA. (Legal: EU residency means no US-transfer question for AI; still run a DPIA for AI processing of tenant PII.)

**Note:** `OPENAI_API_KEY` (direct) is now unused for routing (OpenAI-direct models disabled in favour of Azure). The NVIDIA `NVIDIA_API_KEY` stays as the test/fallback. Gemini/Anthropic remain disabled (single-budget strategy).

## 2. Stripe — review the LIVE pricing changes (MEDIUM — confirm)
**Done by Claude via API (non-destructive):** created AI-Pro (£29/mo), Intelligence pack (£20), Action pack (£15), and **new** Scale (£169/£1,690) + Pro (£329/£3,290) prices, set as each product's `default_price`. Old prices left active.
**Do this:** sanity-check in the Stripe dashboard (Products), confirm the new amounts and that the AI-Pro/pack products read well to customers. Existing subscribers keep their old price until you choose to migrate them (Stripe → Subscriptions → update price), which is a deliberate, separate decision.

## 3. Kimi-on-NIM is broken (FYI — already worked around)
NVIDIA NIM's Kimi deployments are unusable today (`kimi-k2-instruct` 410, `kimi-k2` 404, `kimi-k2.6` returns garbage). Claude **disabled Kimi** and set **Llama 3.3 70B** as the default. If NVIDIA fixes Kimi later, re-enable it in `ai_models` and it'll re-enter routing automatically. No action needed now.

## 4. Web/market intelligence + document extraction need external providers (MEDIUM)
These Copilot tools are **deliberately NOT stubbed** (no-stub rule) because they need an external service that isn't configured:
- **`web.search` / `market.comparables`** — need a search API key. Add one of `TAVILY_API_KEY`, `SERPER_API_KEY`, or `BRAVE_API_KEY` to Vercel env; then the web/market tools can be wired to it. (No UK rent-comp API is currently configured either — for real comparables you'd add a data provider, e.g. PropertyData/Zoopla, behind a key.)
- **`doc.extract`** — reading/parsing uploaded certificates (EICR/Gas/EPC) needs an OCR/extraction provider. The repo has `pdf-lib` (generation only), not a text-extraction/OCR lib. Options: add `unpdf`/`pdf-parse` for text-based PDFs, or a vision-capable model + pipeline for scans. Until then, extraction is not built.

**What IS built and live now:** `doc.generate` (LLM → branded PDF via pdf-lib → R2 → Documents), and form-assist (`/api/ai/form/suggest` + `<CopilotFieldAssist>`). These need no extra provider.

## 5. Complete the visual 603-point QA pass (MEDIUM — needs a logged-in session)
The backend + API-security half of the QA is done and verified live. The visual pass across the 8 viewports (1536×960 … 375×812) could not run because:
1. **No test login** — the Copilot is login + Scale+ gated. Provide a Scale+ test account (or seed one) so the browser can authenticate. Without it only the public/login surface is reachable.
2. **Chrome DevTools MCP got stuck** ("browser already running"). Fix: stop the chrome-devtools-mcp Chrome process and restart the MCP server (it's harness-managed; `/mcp` reconnect or restart Claude Code). Then re-run.
3. **Model coverage** — see §1: add Gemini/Anthropic keys + fix OpenAI 429 so the routing fallbacks are exercised (today only NVIDIA-NIM-Llama serves).

Once logged in with the MCP healthy: open the Copilot bubble on `/property-manager/home`, run a grounded question, a `/create-task` → approval card → confirm (check the task appears in Work + an `ai_audit_log` row), open History/folders, and the `workspace-settings/ai` panels — at each of the 8 viewports, checking console for errors. The API-security checks already pass (all AI endpoints 401 unauthenticated).

## 6. BYOK key encryption (LOW — before enabling BYOK for Enterprise)
`ai_workspace_keys` stores `key_ciphertext`. The encrypt/decrypt helper + the Enterprise settings UI to enter a key are **not yet built** (Phase 1 remainder). Don't advertise BYOK until that lands.
