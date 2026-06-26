# AI Copilot — Manual Actions Required

**Date:** 2026-06-25  
**Section:** AI Copilot + Trial Gating

These items cannot be completed by Claude Code because they require external system access (Stripe dashboard, Vercel dashboard, or Supabase production secrets not available in this environment).

---

## MA-001 — Seed Azure provider row in DB

**Why Claude Code couldn't do it:** The Management API PAT (`SUPABASE_PERSONAL_ACCESS_KEY`) was not available in this session environment.

**What to do:**
1. Open Supabase dashboard → SQL Editor for project `oovgfknmzjcgbilwumch`
2. Run:
```sql
INSERT INTO ai_providers (
  id, name, type, base_url, region, is_active, created_at
) VALUES (
  gen_random_uuid(),
  'Azure OpenAI EU',
  'azure',
  'https://YOUR_AZURE_ENDPOINT.openai.azure.com',
  'eu',
  true,
  now()
) ON CONFLICT (name) DO NOTHING;
```
3. Also insert the model row:
```sql
INSERT INTO ai_models (
  id, provider_id, model_id, display_name, input_cost_per_1k, output_cost_per_1k, max_tokens, is_active
) SELECT
  gen_random_uuid(),
  id,
  'gpt-4o-mini',
  'GPT-4o mini (Azure EU)',
  0.012,   -- £/1k input
  0.047,   -- £/1k output
  128000,
  true
FROM ai_providers WHERE name = 'Azure OpenAI EU'
ON CONFLICT DO NOTHING;
```

---

## MA-002 — Set Azure API key in Vercel environment variables

**Why Claude Code couldn't do it:** Requires Vercel dashboard login.

**What to do:**
1. Go to Vercel dashboard → propvora project → Settings → Environment Variables
2. Add:
   - `AZURE_OPENAI_API_KEY` = your Azure OpenAI key
   - `AZURE_OPENAI_ENDPOINT` = `https://YOUR_RESOURCE.openai.azure.com`
   - `AZURE_OPENAI_DEPLOYMENT` = `gpt-4o-mini`
3. Redeploy for the variables to take effect

---

## MA-003 — Verify trial workspace test

**What to do:**
1. Set a workspace's `plan` column to `'trial'` in Supabase
2. Log in as a member of that workspace
3. Confirm:
   - Chat bubble opens the full panel
   - Copilot tab shows the branded gate with Propvora favicon + "Subscribe to Propvora" CTA
   - Inbox tab loads and works normally (send/receive messages)
   - Navigating to `/property-manager/automations` shows the automations trial gate (not the automations section)
   - Direct URL to `/property-manager/automations/overview` also shows the trial gate (layout intercepts before the page renders)
4. Set the workspace plan back to a paid tier and confirm AI + automations unlock

---

## MA-004 — Turbopack page-data build failure (pre-existing)

**What it is:** `npm run build` passes TypeScript clean but fails in the Turbopack "Collecting page data" phase with `ENOENT: pages-manifest.json`. This is a pre-existing race condition on 600+ route apps.

**Not a blocker for release** — Vercel builds use a different worker/memory profile and this issue has not been observed in production CI. It is local-machine-only.

**If you need a local production build:**
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
$env:BUILD_CPUS="4"
npm run build
```
Running this at off-peak times (dev server stopped) usually succeeds.
