# Legal — Internationalisation: Remaining Manual Actions

All code is implemented and the production build is green. The items below could not be
completed by Claude Code in this session **only** because they require the running dev
server + Chrome MCP + a configured non-GB test workspace — they are evidence-capture and
live-QA steps, not code gaps.

---

## 1. Live multi-viewport browser QA with jurisdiction toggled (evidence capture)

**Why not done in-session:** requires the running dev server, Chrome MCP, and a test
workspace whose `settings.countryCode` is set to a non-GB value (e.g. `FR`, `AU`, `US`)
and one set to a sanctioned code (e.g. `RU`).

**Exact steps:**
1. Start the dev server on your claimed port (`npm run dev -- -p <PORT>`).
2. In a GB workspace, open each tab and confirm full E&W tooling renders:
   - `/property-manager/legal`, `/legal/possession`, `/legal/hmo-licences`,
     `/legal/epc-advisory`, `/legal/rra-2026`.
3. Switch the workspace jurisdiction at **Workspace Settings → Jurisdiction** to `FR`
   (or update `workspaces.settings->>'countryCode'` to `FR` via the Management API PAT),
   then re-open each tab and confirm:
   - Possession / HMO / EPC / Overview show the **amber jurisdiction panel** (not E&W tooling).
   - The **RRA 2026 tab is gone** from the rail and the mobile dropdown.
   - The footer shows the **research-only** disclaimer naming the country.
   - Direct-URL hits to `/legal/possession/new/select-tenancy` and
     `/legal/hmo-licences/<id>` also show the panel (layout-level gate).
4. Set the jurisdiction to a sanctioned code (`RU`) and confirm the **blocked** panel.
5. Capture screenshots at all 8 viewports (1536×960, 1366×768, 1280×720, 1024×768,
   768×1024, 430×932, 390×844, 375×812) for GB and one non-GB jurisdiction.
6. Save under `release-gated/docs/legal/screenshots/`.

**To seed a non-GB test workspace jurisdiction via PAT (no UI needed):**
```sql
-- project ref oovgfknmzjcgbilwumch
update workspaces
set settings = coalesce(settings,'{}'::jsonb) || jsonb_build_object('countryCode','FR')
where id = '<test-workspace-id>';
```
(Run via `POST https://api.supabase.com/v1/projects/oovgfknmzjcgbilwumch/database/query`
with the PAT in `.env.local` as `SUPABASE_PERSONAL_ACCESS_KEY`.)

---

## 2. Dedicated legal RLS suite (recommended, not blocking)

Possession/HMO reads are already workspace-scoped via the existing hooks and RLS. A
dedicated negative-test suite mirroring `scripts/test/money-rls.mjs` would add explicit
evidence that workspace A cannot read/modify workspace B's `possession_cases` /
`possession_evidence` / `hmo_licences`. Claude Code can author this on request — it was
not in scope for the internationalisation drop.

---

## 3. Per-jurisdiction legal content packs (post-V1, external dependency)

Real local possession/eviction procedure, licensing and tenancy law for non-GB
jurisdictions requires **qualified local legal review** before it can be shipped as
authoritative content. This is deliberately out of V1 scope. The V1 behaviour — generic
record-keeping mode + "verify locally" disclaimer for all non-E&W jurisdictions — is the
correct, compliant interim. Do **not** auto-generate statute text for other countries.
