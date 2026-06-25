# Portals — Access Grants / Profiles / Purposes — pending manual actions

**Section:** Portals → Access Grants / Profiles / Purposes
**Status:** ✅ **No release blockers.** All code/DB items closed this session.

---

## Optional follow-up (not a blocker)

### 1. 8-viewport interactive Chrome MCP re-screenshot
- **Why Claude Code did not complete it:** the shared `chrome-devtools-mcp` Chrome
  profile (`C:\Users\PC\.cache\chrome-devtools-mcp\chrome-profile`) was actively locked
  by two other concurrent Claude Code sessions (portfolio-units-tenancies-qa and
  planning-section-qa, both `active` in `.claude/port-registry.md`). Terminating another
  active session's browser is prohibited by AGENTS.md, so a fresh isolated MCP launch
  could not be obtained. This is a tooling-contention issue, **not** a code or release
  blocker.
- **Exact manual steps to complete (when no other session holds the profile):**
  1. Confirm no other session is `active` in `.claude/port-registry.md`.
  2. Launch Chrome MCP on a free port (9222–9240).
  3. Authenticate, then visit each route and capture at 1536/1440/1366/1280/1024/768/430/375:
     - `/property-manager/portals/access` (also open a grant detail `/access/[id]`)
     - `/property-manager/portals/profiles`
     - `/property-manager/portals/purposes`
  4. Save to `release-gated/docs/screenshots/portals-access-*.png` etc.
  5. Confirm 0 console errors at the final viewport.
- **Risk if skipped:** negligible. Routing/auth verified via the live dev server; the
  Portals shell + responsive behaviour were already browser-verified at 100/100 in the
  Overview session; the changes in this pass (banner copy + one removed menu item) are
  non-structural.

### 2. (Roadmap, not V1) Per-workspace Profiles/Purposes customisation
- The `portal_profiles` / `portal_purposes` tables exist in the live DB with full
  member-read / manager-write RLS, but are intentionally **empty** for V1 — every
  workspace uses Propvora's built-in default templates (no custom-template editor
  shipped in V1). This is a deliberate lean-V1 scope decision, surfaced honestly in the
  page banner (FIX-440). When the customisation editor is built, it should: seed the
  workspace's defaults on first write, add an enable/disable + create/edit UI gated to
  owner/admin/manager, and have `GrantPortalAccessModal` consume only `is_enabled`
  templates. No action required for V1 release.
