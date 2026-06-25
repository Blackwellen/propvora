# Legal Section — Live Multi-Viewport Screenshot Evidence

**Captured:** 2026-06-25 · session `legal-i18n-qa` · dev server `localhost:3004` (shared, Next 16 single-instance) · Chrome DevTools MCP
**Account:** jamahl thomas (jamahlthomas1996@gmail.com) · live Supabase data
**Console:** zero errors / zero warnings across every page captured (`list_console_messages` over all navigations).

This is the live before/after proof of the Legal section internationalisation. The same
section, same account, two workspaces:

| Workspace | Jurisdiction | Result |
|---|---|---|
| **Jamahl Thomas** (GB default) | England & Wales (reviewed) | Full statutory tooling, **RRA 2026 tab present**, reviewed disclaimer |
| **JT Property Manager** | United States (research-only) | Jurisdiction panel, **RRA 2026 tab hidden**, "not legal, tax or financial advice" |

## Files

### US (non-GB) — gated state — Legal Overview, all 8 required viewports
- `us-gated-overview-1536x960.png` · `-1366x768` · `-1280x720` · `-1024x768` · `-768x1024` · `-430x932` · `-390x844` · `-375x812`
- Shows: jurisdiction banner ("United States — USD … not reviewed"), tabs **Overview / Possession / HMO Licences / EPC Advisory** (no RRA 2026), gate panel "Legal doesn't apply in US", footer research disclaimer incl. *"This is not legal, tax or financial advice."*

### GB (England & Wales) — reviewed state — Legal Overview, all 8 required viewports
- `gb-reviewed-overview-1536x960.png` · `-1366x768` · `-1280x720` · `-1024x768` · `-768x1024` · `-430x932` · `-390x844` · `-375x812`
- Shows: full "Legal & Compliance Overview" with 4 KPI cards (Possession 2 active, HMO 2 licences, EPC 0%, **RRA 2026 75%** — tab + card present), Upcoming Licence Expiries (live: 88 Hawthorn Street HMO/2023/0188), reviewed E&W footer disclaimer.

### GB — Possession sub-tab (full Section 8 tooling)
- `gb-reviewed-possession-1536x960.png` (desktop) · `gb-reviewed-possession-390x844.png` (mobile)

### Jurisdiction picker (expanded country/currency set)
- `jurisdiction-settings-1536x960.png` — Settings → Jurisdiction. Confirms new currencies **SAR / CHF / SEK / DKK / CZK**, the **UK region selector** (England & Wales / Scotland / Northern Ireland), the **Legal** settings nav entry, and the "General information — not legal, financial or tax advice" guardrail.

### Custom legal packs editor (workspace_legal_modules)
- `settings-legal-custom-pack-editor-1536x960.png` — `/settings/legal`. "Legal Settings" → "Legal jurisdiction modules" (Active: England & Wales, Reviewed badge), all 4 built-in modules with **Edit guidance / Disable**, **Add legal note**, and the "informational only — never unlocks E&W tooling" safety note.

## What this verifies (live)
- ✅ Jurisdiction selection reaches the packs (US workspace correctly gated — FIX-473 backfill confirmed live).
- ✅ RRA 2026 tab hidden for non-E&W, present for E&W (FIX-471).
- ✅ "Not legal, tax or financial advice" disclaimer on the research jurisdiction (FIX-477).
- ✅ Expanded currency set live in the picker (FIX-477).
- ✅ Custom legal packs editor renders + lists built-ins with edit/disable/add (FIX-481).
- ✅ Responsive at all 8 viewports; zero console errors/warnings.
