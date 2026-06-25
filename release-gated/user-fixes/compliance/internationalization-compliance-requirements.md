# Compliance i18n — remaining manual actions

These items could not be completed inside this coding session and need a running
environment or a human/legal step. Each lists exactly why.

## 1. Run `npm run build` to confirm the production build gate
- **Why not done by Claude:** A concurrent Claude Code session held the Next.js
  build lock (`⨯ Another next build process is already running`) — the
  session-port rules forbid killing another session's processes.
- **Exact step:** Once other sessions are idle, run:
  `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
  Expect a clean build — full-repo `npx tsc --noEmit` already returns 0 errors.

## 2. Full 8-viewport AUTHENTICATED browser QA of the 7 sub-tabs
- **Why not done by Claude:** The compliance routes are auth-protected (correctly —
  verified they redirect to `/login`). Driving the authenticated UI needs login
  credentials, which Claude does not have, and Claude will not reset the founder's
  account password to obtain a session. Also, Next 16 allows only one `next dev`
  per directory and a concurrent session already owns it (port 3004), so Claude
  could not start an isolated server. The app boot, login render, auth guard and
  dev-server compile of the changed files were all verified clean.
- **Exact steps (you, logged in):** With a workspace set to a non-GB country in
  Workspace Settings → Jurisdiction, visit each of
  `/property-manager/compliance/{certificates,inspections,documents,evidence,coverage,supplier-docs,reports}`
  at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812.
  Confirm: the footer disclaimer shows the correct jurisdiction + "not legal/tax/
  financial advice" wording, and `/compliance/certificates/new` Step 1 shows that
  country's requirement set (e.g. DPE/Plomb for France, Ejari for UAE). Then in
  Settings → Compliance, add a custom requirement and confirm it appears in the
  wizard; disable a built-in and confirm it disappears.

## 3. RLS positive/negative matrix for `compliance_items`
- **Why not done by Claude:** Needs the Management API PAT + a second test
  workspace to assert cross-workspace isolation; out of scope for this code drop.
- **Exact step:** Using the PAT (see memory `reference-management-pat`), run the
  standard RLS-test SQL pattern asserting a user in workspace A cannot
  select/insert/update `compliance_items` scoped to workspace B.

## 4. Legal review of non-GB requirement sets (LEGAL — not a code task)
- **Why not done by Claude:** The IE/AU/NZ/EU requirement lists are honest,
  commonly-required starting points but are **not** professionally reviewed. The
  UI already labels them research-only and tells the user to verify locally.
- **Exact step:** Have a qualified local professional review and confirm each
  jurisdiction's statutory set, frequencies and exemptions, then promote the
  jurisdiction to `reviewed: true` in `src/lib/compliance/requirements.ts` and the
  matching `country_packs.legal_status`.

## 5. (Optional) Expose a `region` selector for GB (England & Wales vs Scotland)
- **Why not done by Claude:** The catalogue already supports a `region` value
  (`EW`/`SCT`/`NI`) read from `workspaces.settings.region`, but Workspace Settings →
  Preferences does not yet surface a UK-region picker.
- **Exact step:** Add a region dropdown to Workspace Settings → Preferences that
  writes `settings.region`; the compliance section will then switch the GB
  requirement set (E&W ↔ Scotland) automatically.
