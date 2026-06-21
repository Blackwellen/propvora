# Section 16 — Settings / Account / Billing / Profile

Last updated: 2026-06-21 (Session 41 — FIX-229: billing hooks cleared ("Blackwellen Ltd" removed); FIX-247: subscription page fake invoices cleared; FIX-248: billing page plan derived from live data; FIX-218: workspace invoices cleared; FIX-127: account overview stats cleared of fake values; FIX-111: settings dead code removed; all builds EXIT:0)

Coverage for all settings, account management, billing, and profile surfaces across PM workspace, Supplier Solo (SSW), and Supplier Team (STW). Each row tests a specific settings function end-to-end: save, security, plan gate, and audit logging.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Settings Matrix

| ID | Workspace | Settings Area | Route | Function | Saves? | Secure? | Plan Gate? | Audit Log? | Desktop | Phone | Score | Status |
|----|-----------|--------------|-------|----------|--------|---------|-----------|-----------|---------|-------|-------|--------|
| SET-PMW-001 | PM | Profile | /property-manager/account/profile | Edit name/avatar | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-002 | PM | Profile | /property-manager/account/profile | Avatar upload | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-003 | PM | Account | /property-manager/account/security | Password change | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-004 | PM | Account | /property-manager/account/notifications | Notification prefs | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-005 | PM | Workspace | /property-manager/workspace-settings | General settings | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — FIX-111 dead const removed |
| SET-PMW-006 | PM | Workspace | /property-manager/workspace-settings/members | Team members | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-007 | PM | Workspace | /property-manager/workspace-settings/members | Invite member | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-008 | PM | Workspace | /property-manager/workspace-settings/branding | Brand colours | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-PMW-009 | PM | Billing | /property-manager/workspace-settings/billing | Current plan | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — Stripe OAuth blocker (founder task) |
| SET-PMW-010 | PM | Billing | /property-manager/workspace-settings/billing | Upgrade plan | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — Stripe OAuth blocker (founder task) |
| SET-PMW-011 | PM | Billing | /property-manager/workspace-settings/billing | Payment method | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — Stripe OAuth blocker (founder task) |
| SET-PMW-012 | PM | Billing | /property-manager/workspace-settings/billing | Invoices list | ✅ | ✅ | [~] | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-247/248) — fake "Blackwellen Ltd" billing profile removed (FIX-229); hardcoded invoice rows cleared (FIX-247); plan name derives from live Stripe/plan tier not hardcoded "Enterprise" (FIX-248); workspace invoices section cleared (FIX-218). Stripe live still requires BLK-004. Browser test [~]. |
| SET-PMW-013 | PM | I18N | /property-manager/workspace-settings/preferences | Language/locale/currency | ✅ | ✅ | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-098/FIX-125) — 22 locales, 12 currencies, 4 date formats, IANA tz, live preview; saves to workspace_settings.preferences_json (42P01-safe). NOW LINKED from overview CATEGORIES grid (FIX-144) |
| SET-PMW-014 | PM | Jurisdiction | /property-manager/workspace-settings/jurisdiction | Legal jurisdiction | ✅ | ✅ | N/A | N/A | [~] | [~] | 5 | CODE_CONFIRMED — /api/workspace/jurisdiction; pre-existing |
| SET-PMW-015 | PM | Security | /property-manager/workspace-settings/security | MFA policy toggles + session timeout | ✅ | ✅ | N/A | [~] | [~] | [~] | 4 | CODE_CONFIRMED (FIX-141) — policy hydrates from workspace_settings.team bucket on mount; save persists via saveWorkspaceSettings server action; 42P01-tolerant; aria-label+role=switch on all toggles (WCAG AA). Previously broken (setIsDirty only). Browser test [~] |
| SET-PMW-016 | PM | Team | /property-manager/workspace-settings/team | Team member list | ✅ | ✅ | ✅ | ✅ | [~] | [~] | 4 | CODE_CONFIRMED — live workspace_members query; role change via changeMemberRole server action (owner guard); remove via removeMember server action (last-owner guard); aria-labels on remove/resend/close buttons (FIX-143 WCAG). Browser test [~] |
| SET-PMW-017 | PM | Team | /property-manager/workspace-settings/team | Invite member | ✅ | ✅ | ✅ | N/A | [~] | [~] | 4 | CODE_CONFIRMED — inserts to workspace_invitations + fires /api/email/invite; seat gate checks plan seatLimit vs memberCount+pendingCount; 7-day token expiry; optimistic list update. Browser test [~] |
| SET-PMW-018 | PM | Notifications | /property-manager/workspace-settings/notifications | Alert toggles + channels + digest | ✅ | ✅ | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED — loads from getWorkspaceSettings; saves to saveWorkspaceSettings("chat"); push channel permanently disabled (VAPID not configured — honest UI); 42P01-tolerant. Browser test [~] |
| SET-PMW-019 | PM | Integrations | /property-manager/workspace-settings/integrations | Integration status grid | ✅ | ✅ | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED — fetches /api/integrations/status; no hardcoded "Connected"; env-check fallback; 8 integrations shown. Browser test [~] |
| SET-PMW-020 | PM | Overview | /property-manager/workspace-settings | Settings category grid | ✅ | N/A | N/A | N/A | [~] | [~] | 5 | CODE_CONFIRMED (FIX-144) — Language & Preferences now in Configuration group; stat cards derive live team/plan data; all 6 category groups present. Browser test [~] |
| SET-SSW-001 | SSW | Profile | /supplier/settings/profile | Edit profile | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-SSW-002 | SSW | Account | /supplier/settings/account | Account settings | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-SSW-003 | SSW | Billing | /supplier/settings/billing | Subscription | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — Stripe blocker |
| SET-STW-001 | STW | Team | /supplier/settings/team | Team members | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 migration needed |
| SET-STW-002 | STW | Billing | /supplier/settings/billing | Team billing | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 migration + Stripe blocker |

---

## QA Protocol for Settings

1. For each settings row: navigate to route, make a change, save, reload page, confirm persistence.
2. Avatar/logo uploads: test file type validation (reject non-image), size limit, successful upload and display.
3. Password change: verify current password required, new password confirmation, session invalidation behaviour.
4. Invite member: send invite to a new email, confirm invite email sent, accept invite flow works.
5. Brand colours: set custom colour, confirm it propagates to portal/header branding.
6. Billing/upgrade: confirm Stripe integration loads, plan comparison visible, upgrade/downgrade gates correct.
7. Plan gates: attempt to access plan-gated settings on a lower tier, confirm upgrade prompt shown.
8. Audit log: confirm sensitive actions (password change, member invite, billing change) are logged.
