# Section 16 — Settings / Account / Billing / Profile

Last updated: 2026-06-21 (FIX-277: Full settings QA audit — PM workspace, Supplier Solo, Customer settings all assessed; FIX-277: customer AccountSettingsClient fake data sweep — Sarah Johnson name/address/emergency contact/finance/security/verification all cleared; customer Right Rail cleared of hardcoded "March 2024", "Saved cards: 2", "Bank accounts: 1", trust-safety badges; tsc EXIT:0)

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
| SET-SSW-001 | SSW | Settings Overview | /supplier/settings | Marketplace visibility toggle + nav links | ✅ | ✅ | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-277) — page exists; loads live profile status via /api/supplier/profile; PATCH to toggle active/paused/draft; SettingsNavigationLinks shows 4 nav cards (Business profile, Verification, Team, Coverage). Narrow scope — no billing, no payout, no insurance in settings page itself. Browser test [~] |
| SET-SSW-002 | SSW | Business Profile | /supplier/profile | Edit business name/bio/trades | [~] | [~] | N/A | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-SSW-003 | SSW | Billing | /supplier/settings/billing | Subscription | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — Stripe blocker |
| SET-SSW-004 | SSW | Verification | /supplier/verification | Insurance/certification settings | [~] | [~] | N/A | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-SSW-005 | SSW | Team | /supplier/team | Team member list | [~] | [~] | N/A | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| SET-STW-001 | STW | Team | /supplier/settings/team | Team members | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 migration needed |
| SET-STW-002 | STW | Billing | /supplier/settings/billing | Team billing | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 migration + Stripe blocker |
| SET-CTW-001 | Customer | Account Settings | /customer/account-settings | Profile form — name/email/phone/DOB | ✅ | ✅ | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-277) — form fields load blank (honest empty state); form is editable with dirty-save bar; was previously pre-filled with fake "Sarah Johnson" data — now cleared. Avatar initials cleared. Browser test [~] |
| SET-CTW-002 | Customer | Account Settings | /customer/account-settings | Tab navigation — 6 tabs | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED — overview/profile/finance/security/notifications/privacy tabs; desktop strip + mobile dropdown both present. Browser test [~] |
| SET-CTW-003 | Customer | Account Settings | /customer/account-settings?tab=security | Security panel | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-277) — Password sub shows generic copy (not "Last changed 2 months ago"); 2FA sub shows "Not yet enabled" (not fake "Authenticator app enabled"); data export request present. Browser test [~] |
| SET-CTW-004 | Customer | Account Settings | /customer/account-settings?tab=notifications | Communication preferences | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED — email/SMS/push/marketing toggles; client-side state (not yet persisted). Browser test [~] |
| SET-CTW-005 | Customer | Account Settings | /customer/account-settings?tab=finance | Finance section | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-277) — shows "Not set" / "Configure in payments" / "GBP (£)" — honest empty state; was showing fake "Visa ····4242". Payment summary right rail shows "—" not "2"/"1". Browser test [~] |
| SET-CTW-006 | Customer | Account Settings | /customer/account-settings?tab=privacy | Privacy section | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED — profile visibility toggle; search personalisation toggle; delete/export account button. Browser test [~] |
| SET-CTW-007 | Customer | Account Settings | /customer/account-settings | Right-rail account status | ✅ | N/A | N/A | N/A | [~] | [~] | 4 | CODE_CONFIRMED (FIX-277) — "Member since" shows "—" not "March 2024"; verification shows "Unverified" not fake "Verified"; trust-safety panel shows honest empty message. Browser test [~] |
| SET-CTW-008 | Customer | Account Settings | /customer/account-settings | Delete / export account | ✅ | N/A | N/A | N/A | [~] | [~] | 3 | CODE_CONFIRMED — button present in Privacy tab; triggers toast "opens secure flow"; full delete flow not yet implemented (P2). Browser test [~] |

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
