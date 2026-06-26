# Master Release-Readiness QA Checklists (canonical)

The three audit tiers every i18n surface must pass. The Integration To-Do binds each
lettered workstream's routes to the relevant tier. Run with Chrome MCP at all 8
viewports (1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812)
**and** test the code (UI, DB, Supabase/RLS, edge functions, unit/integration/E2E,
security, performance). No surface is complete below 100/100.

i18n-specific overlay (applies on top of every tier — verify on each surface):
- Record-true surfaces show the **property's** jurisdiction (locked chip); section overviews show the **lens** (switchable / grouped).
- Every jurisdiction value renders via `<SourcedValue>` (source chip + edit + citation) with the permanent dismissible **NotLegalAdviceNotice**.
- Money uses `formatMoney` in the property's currency with reporting-currency roll-up; dates via `formatDate`.
- Override chain (case▸property▸workspace▸sourced▸blank) works + audit-logged; sub-statutory-minimum warns, never blocks.
- RLS negative tests include wrong-jurisdiction and cross-workspace property leakage.

---

## TIER 1 — Main Section / Overview audit (220)

### 1. Route, Shell, Navigation & Page Structure
1. Confirm the main section route loads correctly.
2. Confirm the route is registered in the route registry.
3. Confirm the route is registered in the sidebar/menu config.
4. Confirm the route is registered in the breadcrumb config.
5. Confirm the route is registered in the permission map.
6. Confirm the route is reachable from every intended navigation path, not only by direct URL.
7. Confirm deep-link access works when pasting the URL into a fresh browser session.
8. Confirm hard refresh loads the same section correctly.
9. Confirm browser back/forward behaviour works correctly.
10. Confirm unauthenticated users are redirected correctly.
11. Confirm users without workspace access are blocked with the correct 403/no-access state.
12. Confirm old, renamed or duplicate routes redirect correctly.
13. Confirm the correct app shell loads for the surface: property-manager workspace, portal or admin.
14. Confirm the correct sidebar is shown.
15. Confirm the correct top nav is shown.
16. Confirm the correct breadcrumbs are shown.
17. Confirm the page title and browser title are correct.
18. Confirm the H1, subtitle and section description are clear and consistent.
19. Confirm the active sidebar item is correct.
20. Confirm this route does not expose sections hidden by role, plan, add-on or feature flag.

### 2. Header, Layout, Width & Premium Styling
21. Confirm header layout is consistent with the benchmark at /property-manager/home.
22. Confirm page width aligns with the global shell/max-width system.
23. Confirm page edges align with the top nav, quick nav and content grid.
24. Confirm borders, padding, spacing and gutters are consistent.
25. Confirm the section header, KPI row, action bar and main content grid align to the same width.
26. Confirm the page does not use random max-widths, one-off padding or inconsistent shell alignment.
27. Confirm cards, panels and containers use Propvora design tokens.
28. Confirm colours, typography, borders, shadows, icons, badges and radii match the Propvora premium system.
29. Confirm no hard-coded one-off colours, sizes or spacing are used where shared tokens should be used.
30. Confirm white-label branding flows into logos, brand colours, buttons, emails, PDFs and portal surfaces where relevant.
31. Confirm sticky headers/action bars do not overlap content.
32. Confirm the page does not visually clash with other Propvora sections.
33. Confirm any required UI upgrade is completed to reach premium release quality.
34. Confirm any missing shared components are added or replaced with existing Propvora primitives.
35. Confirm styling is consistent across desktop, tablet, mobile and PWA.

### 3. KPI Cards, Summary Cards & Overview Data
36. Confirm KPI/stat cards use consistent styling, sizing, spacing and data logic.
37. Confirm all KPI/stat values use real data, not mock data.
38. Confirm no fake metrics, placeholder cards or decorative-only stats remain.
39. Confirm KPI calculations are correct.
40. Confirm KPI counts update after create, edit, delete, archive, restore and status changes.
41. Confirm KPI cards respect workspace, property/operator context, role, RLS, plan gates and add-on gates.
42. Confirm KPI badges, risk badges, financial values and status colours are consistent.
43. Confirm dates, currencies, property counts and financial figures format correctly for the property/workspace locale.
44. Confirm timezone handling is correct for deadlines, reminders, compliance dates, calendar links and activity logs.
45. Confirm KPI loading states match final layout and do not cause layout shift.
46. Confirm KPI empty states are useful.
47. Confirm KPI errors are handled clearly and safely.

### 4. Main Content, Views, Filters, Search & Sorting
48. Confirm main content uses the correct shared components: tables, cards, boards, timelines, calendars, maps or reports where relevant.
49. Confirm list/card/table/board/calendar/map views work where included on the overview page.
50. Confirm view toggles work and persist where intended.
51. Confirm filters work correctly.
52. Confirm search works correctly.
53. Confirm sorting works correctly.
54. Confirm clearing filters returns the correct default state.
55. Confirm search/filter results update counts, KPI cards and empty states correctly.
56. Confirm sort order is logical and stable, especially for dates, risk, money, status and names.
57. Confirm pagination or infinite loading works and does not duplicate, skip or misorder records.
58. Confirm large data states work, not only tiny seed data.
59. Confirm no placeholder rows, fake records, lorem ipsum or disconnected demo data remain unless clearly marked as demo data.
60. Confirm all data shown belongs to the active workspace and active property/operator context.
61. Confirm nested records shown are scoped to the correct workspace, property, unit, tenancy, supplier, contact or user where relevant.
62. Confirm exports use the current filters, sorting, search and workspace scope.
63. Confirm imported/exported CSV/PDF data matches on-screen values.
64. Confirm print/PDF/report views work where relevant.

### 5. Buttons, Quick Actions & Functional Wiring
65. Confirm every button routes correctly or performs the correct action.
66. Confirm quick actions are useful, working and not duplicated.
67. Confirm every CTA opens the correct wizard, modal, detail route, report, export or workflow.
68. Confirm disabled buttons have a clear reason: permission, plan, add-on, feature flag, locked state or missing required data.
69. Confirm no dead buttons, fake submit buttons or placeholder flows remain.
70. Confirm destructive actions have confirmation, permission checks and audit logs.
71. Confirm save/create/status actions prevent duplicate submissions.
72. Confirm double-clicking create/save/action buttons does not create duplicate records.
73. Confirm optimistic UI changes roll back correctly after failed saves.
74. Confirm cache invalidation works after create, edit, delete, archive, restore and status changes.
75. Confirm realtime updates work where expected, or that refresh behaviour is clear.
76. Confirm all user-facing functions in the overview section are tested end to end.
77. Confirm actions created here appear in all expected connected sections.
78. Confirm records changed elsewhere update this overview section correctly.

### 6. Auth, Roles, RLS, Feature Flags, Plans & Add-ons
79. Confirm auth protection is enforced.
80. Confirm users with limited roles see only allowed actions, fields, cards, records and data.
81. Confirm hidden or disabled actions cannot still be triggered through direct API calls.
82. Confirm permissions/RLS prevent cross-workspace leakage.
83. Confirm positive RLS tests pass for allowed users.
84. Confirm negative RLS tests fail for wrong workspace, wrong role, wrong user, wrong parent record, missing subscription, missing add-on and disabled feature flag.
85. Confirm Supabase queries are scoped by workspace_id, user role and relevant parent context.
86. Confirm direct API/RPC calls cannot read, create, update, delete, upload, export or trigger actions outside permission.
87. Confirm add-on gating works if an add-on is required.
88. Confirm subscription gating works if a subscription level is required.
89. Confirm feature flag gating works independently from subscription/add-on gating.
90. Confirm feature flags can be controlled from Platform Admin where required.
91. Confirm disabled feature-flagged areas do not leak through nav, search, direct URLs, APIs, dashboards, reports, notifications, AI or automations.
92. Confirm plan gates, add-on gates, role gates and feature flags do not conflict.
93. Confirm upgrade/paywall states clearly explain the required plan/add-on and route correctly to billing.

### 7. Empty, Loading, Error, Blocked & Upgrade States
94. Confirm empty states exist.
95. Confirm loading states exist.
96. Confirm error states exist.
97. Confirm blocked/no-access states exist.
98. Confirm upgrade/paywall states exist where relevant.
99. Confirm all empty states have useful copy, CTA and correct permissions logic.
100. Confirm all blocked states explain why the user cannot access something.
101. Confirm error states include safe support/debug references without exposing sensitive details.
102. Confirm loading skeletons match the final layout and do not cause layout shift.
103. Confirm error boundaries catch route/component failures properly.
104. Confirm no white-screen states remain.
105. Confirm no broken imports, lazy-load failures or missing chunks remain.
106. Confirm no console errors, React warnings, hydration warnings or failed network requests appear.

### 8. Cross-Section Integrations
107. Confirm the section wires correctly into activity feeds where relevant.
108. Confirm activity feed events are human-readable and link back to the correct record.
109. Confirm audit logs capture who did what, when, from which workspace and which record changed.
110. Confirm this section wires into Account Settings where required.
111. Confirm this section wires into Workspace Settings where required.
112. Confirm this section wires into Billing Settings where required.
113. Confirm this section integrates with global search where relevant.
114. Confirm this section integrates with notifications/reminders where relevant.
115. Confirm notifications are triggered only where intended.
116. Confirm notification preferences are respected.
117. Confirm email/SMS/in-app notifications do not send in test/demo mode unless explicitly allowed.
118. Confirm this section integrates with AI Copilot only where useful.
119. Confirm Copilot grounding respects route context, workspace context and permissions.
120. Confirm Copilot cannot reveal records the user cannot access.
121. Confirm automations triggered from this section are gated, logged and testable.
122. Confirm automation actions from this section do not duplicate, loop or bypass permissions.
123. Confirm help/docs/tooltips exist for complex actions.
124. Confirm support/admin can diagnose issues from logs without exposing sensitive customer data.
125. Confirm workspace switching refreshes this route cleanly and does not show stale data.

### 9. Files, Storage, SMTP & External Services
126. Confirm R2/file upload really works where this section allows uploads.
127. Confirm uploaded files/images use secure storage-backed flows, not pasted external URLs.
128. Confirm public/private file URLs are not exposed incorrectly.
129. Confirm signed/private file access is used where required.
130. Confirm file previews handle missing, deleted, large, unsupported and malicious file types safely.
131. Confirm file type, size, permission and storage-path validation exists where uploads are allowed.
132. Confirm uploaded files are scoped to the correct workspace and record.
133. Confirm document/file actions are audit-logged where required.
134. Confirm SMTP/email sending works where this section sends emails, invites, reminders, notices or alerts.
135. Confirm email templates use correct workspace branding, sender, reply-to and variables.
136. Confirm external integrations used by this section are wired, gated and tested.
137. Confirm failed integration calls show clear errors and do not corrupt local state.

### 10. Database, Schema, Edge Functions & Migrations
138. Confirm database tables used by this route exist.
139. Confirm frontend fields align with database schema columns.
140. Confirm schema columns, enums, defaults, timestamps and constraints are correct.
141. Confirm foreign keys and parent-child relationships are correct.
142. Confirm required IDs, unique rules, status values and indexes exist.
143. Confirm RLS policies allow correct access and block incorrect access.
144. Confirm related edge functions have auth, workspace ownership checks, input validation, rate limits and structured errors.
145. Confirm Supabase functions/RPCs cannot be abused cross-workspace.
146. Confirm migrations apply cleanly.
147. Confirm migrations can be reproduced from a fresh database.
148. Confirm rollback/manual fix notes are written where migrations require user action.
149. Confirm all migrations that can be done with PAT are completed.
150. Confirm backup/PITR expectations are documented if this area handles critical customer data.

### 11. Responsive, PWA, Accessibility & Browser QA
151. Confirm responsive behaviour at 1440, 1280, 1024, tablet, mobile and PWA sizes.
152. Confirm Chrome MCP/browser QA has been run at all required screen sizes.
153. Confirm mobile layout remains usable.
154. Confirm mobile/PWA safe-area spacing works for iOS/Android.
155. Confirm tablet layout is clean and not cramped.
156. Confirm PWA tabbing or compact navigation uses dropdown patterns where required.
157. Confirm tablet tabbing or compact navigation uses sliding menu patterns where required.
158. Confirm touch targets are large enough on tablet/mobile.
159. Confirm keyboard navigation works for header actions, filters, menus, buttons, modals and overview controls.
160. Confirm focus states are visible and consistent.
161. Confirm WCAG contrast passes for text, badges, buttons, alerts, disabled states and cards.
162. Confirm screen-reader labels exist for icon-only buttons, menus, filters, status badges and important controls.
163. Confirm screenshots/evidence are saved for before/after if visual repair was needed.
164. Confirm visual regression checks are run against the benchmark styling and shell alignment.

### 12. Testing, Security, Performance & Stress Checks
165. Run unit tests for the overview route.
166. Run integration tests for the overview route.
167. Run saving and persistence tests.
168. Run full E2E customer story tests.
169. Run security tests.
170. Run RLS positive tests.
171. Run RLS negative tests.
172. Run visual regression tests.
173. Run relevant edge-function tests.
174. Run realistic stress tests.
175. Run DDoS/rate-limit tests proportionately against exposed endpoints, not destructively against production.
176. Confirm stress tests include realistic property, tenancy, work, compliance, finance, document and activity-feed volumes where relevant.
177. Confirm route load time passes the release performance budget.
178. Confirm bundle size is acceptable.
179. Confirm Supabase query speed is acceptable.
180. Confirm large dataset behaviour is acceptable.
181. Confirm no N+1 query patterns exist.
182. Confirm no expensive dashboard queries run unnecessarily.
183. Confirm rate limiting/throttling applies to expensive route actions, AI actions, exports, uploads and automations.
184. Confirm observability exists: frontend errors, backend errors, slow queries, failed API calls and failed edge functions.
185. Confirm logs are safe and do not expose sensitive customer data.

### 13. Product Scope, Redundancy & Bloat Review
186. Confirm this overview section has a clear customer purpose.
187. Confirm this section is production-useful and not decorative.
188. Confirm this section does not duplicate another area unnecessarily.
189. Confirm anything duplicated from elsewhere is removed, merged or feature-flagged.
190. Confirm any redundant cards, buttons, stats, tabs or panels are removed.
191. Confirm this section does not create unnecessary V1 bloat.
192. Confirm the section should not be merged elsewhere.
193. Confirm advanced/unreleased functionality is hidden behind feature flags.
194. Confirm all remaining features in this section are valuable for the release.
195. Confirm the page is ready for production, not just visually acceptable.

### 14. Release Evidence Document & Final Score
196. Create a release evidence document for this section at /release-gated/docs/{section-name}.md.
197. Include the section name and route.
198. Include the screen sizes tested.
199. Include screenshots/evidence tested.
200. Include routes tested.
201. Include buttons/actions tested.
202. Include filters/search/sorting/views tested.
203. Include data sources tested.
204. Include Supabase tables checked.
205. Include RLS policies checked.
206. Include edge functions checked.
207. Include storage buckets checked where relevant.
208. Include integrations checked where relevant.
209. Include bugs found.
210. Include fixes made.
211. Include migrations applied.
212. Include tests run.
213. Include performance/security findings.
214. Include cross-section effects checked.
215. Include any pending user/manual actions.
216. Add anything that cannot be completed to /release-gated/user-fixes/{section-name}.md with exact steps.
217. Give the section a release score out of 100.
218. Fix all issues until the section reaches 100/100.
219. Do not mark this section complete below 100/100.
220. Confirm final release decision: ready for release | ready behind feature flag | ready for admin-only beta | blocked pending manual fix | removed/merged due to bloat.

---

## TIER 2 — Sub-Tab audit (317)

### 1. Sub-Tab Route, Registration & Parent Context
1. Registered in the route registry.
2. Registered in the tab registry.
3. Registered in the parent section config.
4. Registered in the sidebar/menu config where relevant.
5. Registered in the breadcrumb config.
6. Registered in the permission map.
7. Registered in the feature flag map where relevant.
8. Registered in the subscription/add-on gate map where relevant.
9. Sub-tab route loads correctly.
10. Reachable by clicking through the parent section UI, not only by direct URL.
11. Deep link works in a fresh browser session.
12. Reloads correctly on hard refresh.
13. Hard refresh does not lose workspace context.
14. Hard refresh does not lose parent section context.
15. Browser back/forward works across parent → sub-tab → previous route.
16. Route state, query params and selected tab state behave correctly.
17. Parent section context preserved between sibling tabs.
18. Parent workspace/property/operator/user/portal context does not reset on click.
19. Old/renamed/duplicate sub-tab routes redirect correctly.
20. Tab URLs use clean, predictable patterns.
21. No duplicate route variants for the same sub-tab.
22. Unauthenticated users redirected correctly.
23. No-workspace users blocked with correct 403/no-access.
24. Limited roles can only open permitted sub-tabs.
25. Hidden/disabled sub-tabs cannot be opened via direct URL.
26. Hidden/disabled actions cannot be triggered via direct API.

### 2. Tab Navigation, Naming & State Behaviour
27. Appears in the correct parent tab group.
28. Tab order logical and consistent across Propvora.
29. Name clear, customer-friendly, not duplicated.
30. Tab name, H1, breadcrumb, browser title consistent.
31. Active tab styling correct.
32. Hover/focus/disabled/locked states match tokens.
33. Active tab state survives refresh where intended.
34. Active tab state survives back/forward where intended.
35. Active tab state behaves correctly after workspace switching.
36. Query params/filters/search/view state intentionally preserved or cleared.
37. Tab count badges accurate.
38. Status badges accurate.
39. Notification badges accurate.
40. Tab badges live and permission-aware.
41. Badge colours follow brand/status tokens.
42. Tab counts update after create/edit/delete/archive/restore/status changes.
43. Clear product purpose.
44. Not a dumping ground for unrelated records.
45. Does not duplicate a feature handled better elsewhere.
46. Any duplicated function removed/merged/feature-flagged.
47. Should remain a first-level sub-tab (not merged/promoted/removed).
48. Does not create unnecessary V1 bloat.

### 3. Shell, Header, Width & Premium Styling
49. Correct app shell loads (workspace/portal/admin).
50. Correct sidebar shown.
51. Correct top nav shown.
52. Correct breadcrumbs shown.
53. Header consistent with /property-manager/home benchmark.
54. Sub-tab header consistent with the rest of Propvora.
55. Page width aligns to global shell/max-width.
56. Header, filter bar, cards, tables, action bars align to shell width.
57. Borders/padding/spacing/gutters consistent.
58. No random max-widths/one-off padding/misalignment.
59. Sticky bars don't overlap content (all viewports).
60. Cards/tables/boards/timelines/calendars/maps/panels use shared primitives.
61. No one-off component where a shared one should be used.
62. Uses shared design tokens (no hard-coded colours/widths/shadows/type).
63. Typography/icons/badges/buttons/cards/borders/radii/shadows match premium system.
64. White-label branding flows in where relevant.
65. Required UI upgrade completed to premium quality.
66. Missing shared component added/replaced with the right primitive.
67. Styling consistent across desktop/tablet/mobile/PWA.

### 4. Responsive, Tablet, Mobile & PWA
68. Responsive at 1440/1280/1024/tablet/mobile/PWA.
69. Chrome MCP QA run at all required sizes.
70–72. Usable at 1440/1280/1024.
73. Tablet clean, not cramped.
74. Mobile usable.
75. Mobile/PWA tabbing → clean dropdown selector where required.
76. Tablet tabbing → sliding segmented menu where required.
77. No unintended horizontal scroll on mobile.
78. Sticky action bars don't overlap on mobile/PWA.
79. Mobile safe-area spacing works (iOS/Android).
80. Touch targets large enough.
81. Screenshots captured at all sizes.
82. Before/after screenshots saved where repaired.
83. Visual regression vs benchmark + shell alignment.

### 5. Data, KPI Cards, Views & Content Quality
84. All data loads correctly.
85. All data live from Supabase / correct integration.
86. No mock/stale data or fake metrics.
87. No lorem ipsum/placeholder/fake records unless clearly demo-only.
88. Demo/seed data realistic, sector-specific, enriched, clearly marked.
89. KPI/stat cards consistent where included.
90. KPI/stat values calculated correctly.
91. KPI/stat values update after create/edit/delete/archive/restore/status.
92–95. Tables/cards/boards/calendar/timeline/map fields useful for the real customer story.
96. Columns/fields don't expose sensitive data to restricted roles.
97. Dates/currencies/percentages/rent/arrears/deposits/invoices/values format for the property/workspace locale.
98. Date filters handle timezone/deadlines/reminders/compliance dates.
99. Status/risk/financial/workflow badges consistent.
100–102. Useful empty / clear loading / safe error states.
103. Loading skeletons match layout, no shift.
104. Error boundaries catch failures without breaking the parent.
105. No console errors/React/hydration warnings/failed calls/broken chunks/white-screens.

### 6. Filters, Search, Sorting, Saved Views & Pagination
106–110. Filters/search/sorting/view switchers work and persist where expected.
111. Filter chips styled consistently.
112–114. Saved/advanced filters work; no cross-workspace/user leak unless shared.
115. Clearing filters returns correct default.
116. Filters update counts/KPIs/empty states.
117–121. Search handles no-results/partial/special-chars/case/large datasets.
122. Sorting stable for dates/money/risk/compliance/status/names.
123–126. Pagination/infinite scroll works; no duplicate/skip/misorder.
127. Large dataset testing performed.
128. Exports use current filters/search/sorting.
129. Imports validate type/size/schema/duplicates/workspace ownership.

### 7. Buttons, Actions, Inline Editing & Bulk Actions
130–135. Every button/row/card/quick/dropdown action works and routes to the right wizard/modal/detail/export/import/workflow/integration.
136. Disabled buttons have reason/tooltip/upgrade explanation.
137. No dead buttons/placeholder cards/fake flows.
138–142. Inline editing works, persists, validates, errors clearly, rolls back optimistic UI.
143–144. Double-click doesn't duplicate; backend idempotency/constraints prevent duplicates.
145. Destructive actions: confirmation + permission + audit log.
146. Archive/delete/restore consistent with Propvora.
147–151. Bulk actions work and respect selection/filters/workspace/role/plan/add-on/flag.
152–153. Export/download permission-gated and audit-logged where required.
154. All user-facing functions tested end to end.

### 8. Status, Workflow & Business Logic
155–157. Status workflows enforced by code; invalid transitions blocked; valid ones work.
158–161. Status changes write activity + audit, trigger notifications, update connected dashboards/KPIs/lists/details/reports.
162. Business rules enforced on frontend AND backend.
163. Locked/archived/completed/restricted records can't be changed incorrectly.
164. Created records have correct default status.
165. Child records scoped to correct parent (workspace/property/unit/tenancy/supplier/contact/invoice/job/compliance/planning).

### 9. Auth, Roles, RLS, Feature Flags, Plans & Add-ons
166–185. Auth enforced; roles see only allowed; RLS scoped + no cross-workspace leak; positive & negative RLS tests; direct API/RPC can't bypass; edge functions validate auth/ownership/input/rate-limit/errors; add-on/subscription/feature-flag gating works and doesn't conflict; flagged sub-tabs don't leak via nav/breadcrumb/search/URL/API/admin/reports; upgrade states explain plan and link to billing; hidden actions can't be API-triggered.

### 10. Cross-Section Integrations, Activity, Notifications, AI & Automations
186–190. Wires into activity feeds (human-readable, links back); audit logs capture user/workspace/record/action/timestamp/route.
191–196. Wires into Account/Workspace/Billing settings where required; updates connected dashboards/KPIs/details/reports; created/edited/deleted records propagate cross-section.
197–199. Notification prefs respected; no unexpected demo/test sends; SMTP flows tested for invites/reminders/invoices/notices.
200–202. Copilot actions useful/grounded/permission-gated/audit-logged; can't reveal hidden records; rate-limited + usage-tracked + clear failures.
203–204. Automations gated/logged/rate-limited/testable; no double-run from repeat visits/duplicate events.
205. Support/admin can diagnose without exposing sensitive data.

### 11. Files, Uploads, Storage, SMTP & External Services
206–217. R2 upload works (upload-only, workspace+record scoped); no incorrect public URLs; signed/private access where required; previews handle missing/deleted/large/unsupported/malicious safely; validation of size/type/permission/ownership/path; files attach to the right record; file actions audit-logged; SMTP flows + templates (branding/sender/reply-to/vars) correct; failed integration calls error clearly without corrupting state.

### 12. Database, Schema, Constraints, Migrations & Seeds
218–234. Tables exist; fields align to columns; columns/enums/defaults/timestamps/constraints correct; FKs/parent-child/unique/status/indexes exist; RLS allows/blocks correctly; edge functions/RPCs not cross-workspace abusable; migrations apply cleanly + reproducible from fresh DB; all PAT-able migrations done; rollback/manual notes written; seed data realistic/sector-specific/safe; demo data marked; backup/PITR documented for critical data.

### 13. Accessibility, Browser QA, Performance & Observability
235–239. Keyboard nav across tabs/filters/menus/tables/cards/forms/modals; ARIA roles for tablists/panels/menus/dialogs/tables/badges; visible focus; WCAG contrast; SR labels for icon-only controls.
240–242. Slow/offline/PWA handled; cache invalidates after writes; no stale data after workspace/role/permission/plan changes.
243–249. Route/query/render speed within budget; bundle acceptable; large-table behaviour OK; no N+1; no unnecessary expensive queries.
250–252. Rate limits on expensive actions/exports/uploads/AI/automations; observability for frontend/backend/edge/slow-query/API/permission failures; logs safe.

### 14. Testing, Stress & Security
253–268. Unit (render/permissions/empty-loading-error/validation/actions); integration (Supabase/RLS/edge/storage/connected sections); saving/persistence; E2E customer story; negative E2E (blocked user/wrong workspace/missing add-on/missing subscription/disabled flag).
269–276. Security; RLS positive/negative; visual regression; realistic stress (real volumes); proportionate rate-limit tests; all fixes implemented before scoring.

### 15. Product Scope, Redundancy & Bloat
277–286. Clear purpose; production-useful not decorative; no unnecessary duplication; duplicates removed/merged/flagged; redundant cards/buttons/stats/filters/views/panels removed; no V1 bloat; not merge-able away; advanced/unreleased flag-hidden; remaining features valuable; production-ready not just visually acceptable.

### 16. Release Evidence Document & Final Score
287–317. Create evidence doc at /release-gated/docs/{section}/{sub-tab}.md including parent section name+route, sub-tab name+route, screenshots, screen sizes, tabs/buttons/forms/filters/inline-edits/exports tested, data sources, Supabase tables, RLS, edge functions, storage, integrations, bugs, fixes, migrations, tests, perf/security, cross-section effects, pending manual actions; add un-completable items to /release-gated/user-fixes/{section}/{sub-tab}.md with exact steps; score /100; fix to 100/100; don't mark complete below 100; final decision: ready for release | ready behind flag | admin-only beta | blocked pending manual fix | removed/merged.

---

## TIER 3 — Sub-Sub-Tab (nested) audit

Same 16-category structure as Tier 2, with the nested-specific additions:
- **Route hierarchy:** registered in the nested tab registry + parent tab config; full hierarchy main → parent sub-tab → nested sub-tab correct; nested slugs clean; no duplicate variants.
- **Parent/child context & nested state:** parent section + parent sub-tab + record context preserved across nested tabs; nested filters don't bleed into siblings; nested view state stable on refresh/back-forward; reset safely on workspace switch; nested data can't show sibling-parent or different-record data; nested tab updates when parent record/filter changes.
- **Visual hierarchy:** no stacked-header clutter (page header + parent tab + nested tab + filters + actions); nested content doesn't jump/collapse/overflow on tab switch; aligns to the same shell width as parent and the /property-manager/home benchmark.
- **Promotion/merge review:** confirm the nested tab shouldn't be promoted to first-level or merged into its parent to cut depth; not duplicating a nested tab under a different parent; not hiding an important workflow too deep.
- **Evidence:** doc at /release-gated/docs/{section}/{sub-tab}/{nested}.md; score /100; same final-decision set.

> Wizards and item/detail pages use the same 16-category spine, swapping the route/registration block for **wizard-step** checks (each step validates before Next; Back/Save/Finish work; success state; draft persistence; no duplicate submit) or **detail-page** checks (record-true jurisdiction chip; every detail sub-tab loads; right-rail actions wired; print/export).

