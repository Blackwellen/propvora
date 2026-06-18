# Customer dashboard · batch 03 · Images 320–329

All pages use **Chrome: Customer top-nav** (see batch 01 header). Light theme only.

---

### Image 320 — `/customer/lets/tenancies/[id]/rent-payments` — Rent payments
- **Area / Persona:** Customer dashboard · tenancy rent.
- **Route:** `/customer/lets/tenancies/[id]/rent-payments`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Rent schedule, receipts, deposit & arrears tracking.
- **Layout:** Back to tenancy → header → `TenancySubNav` → 5 KPI tiles (next rent due / paid this year / outstanding balance / deposit held / overpayment credit) → 2-col `[1fr_320px]`: left = Rent schedule table (Month·Due·Amount·Status·Method·Receipt, row-select); right sticky = payment-details panel (amount, status, breakdown, **Pay** when due, Download receipt / pro forma invoice / Set up autopay / Contact support).
- **Primary components:** KPI tiles, rent schedule table with status pills + receipt download, payment-detail rail.
- **Local nav / tabs / filters:** TenancySubNav; row select.
- **Actions:** Pay (toast); download receipt/invoice; autopay; support.
- **States:** seeded schedule (Jun due, rest paid).
- **PWA notes:** table → cards; pay CTA sticky bottom.

---

### Image 321 — `/customer/lets/tenancies/[id]/maintenance` — Tenancy maintenance
- **Area / Persona:** Customer dashboard · tenancy repairs.
- **Route:** `/customer/lets/tenancies/[id]/maintenance`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Report and track repairs for the tenancy.
- **Layout:** Back to tenancy → header (+ Report a repair) → `TenancySubNav` → 5 KPI tiles (open / in progress / emergency / awaiting landlord / resolved) → 2-col `[1fr_360px]`: left = requests table (Issue·Category·Reported·Priority·Status, row-select + search); right sticky = issue-detail panel (description, photo grid + add, contractor appointment with Approve, status timeline, Message PM / Mark resolved, emergency note).
- **Primary components:** KPI tiles, request table with priority/status pills, issue detail with photo upload + timeline.
- **Local nav / tabs / filters:** TenancySubNav; search; row select.
- **Actions:** Report repair; approve appointment; message PM; mark resolved; add photo — toasts.
- **States:** seeded 5 requests.
- **PWA notes:** table → cards; detail → bottom sheet; camera capture for photos.

---

### Image 322 — `/customer/lets/tenancies/[id]/move-in` — Move-in checklist
- **Area / Persona:** Customer dashboard · tenancy move-in.
- **Route:** `/customer/lets/tenancies/[id]/move-in`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Interactive move-in checklist (keys, inventory, meters, photos).
- **Layout:** Back to tenancy → header (+ Download checklist) → `TenancySubNav` → 5 KPI tiles (completion % / items completed / pending / move-in date / documents) → 2-col `[1fr_320px]`: left = checklist card (progress bar + togglable items with category, status pill, contextual Upload/Add reading/Sign actions); right sticky = move-in summary, Contacts, **Mark move-in complete** button.
- **Primary components:** KPI tiles, interactive checklist (`useState` toggle), progress bar, summary rail.
- **Local nav / tabs / filters:** TenancySubNav.
- **Actions:** toggle items; upload photos / add meter reading / sign inventory (toasts); Mark complete (gated on 100%).
- **States:** live checkbox state; pct recomputes.
- **PWA notes:** checklist tap targets; camera for condition photos; complete CTA sticky.

---

### Image 323 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 1 Applicant Details
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (dynamic: id; step 1 of 6)
- **Chrome:** Customer top-nav.
- **Purpose:** Capture applicant personal details.
- **Layout:** Breadcrumb (Applications › id) + title + actions (Save draft / Back / Next) → 6-step horizontal stepper (Applicant Details / Income / References / Guarantor / Documents / Review & Submit) → 3-col `[260px_1fr_300px]`: left = Application progress list + Linked property card + Affordability donut; centre = step card with upload tiles for "Personal details" group; right = Application summary (rent/deposits/total upfront), checklist, Applicant + Guarantor, encryption note.
- **Primary components:** stepper, progress list, affordability gauge, upload tiles, summary/checklist rail.
- **Local nav / tabs / filters:** stepper (clickable); Save draft persists to localStorage.
- **Actions:** Next/Back/Save draft; upload tiles (toasts, upload-only).
- **States:** progress persisted; default opens at step 5 (Documents) but step 1 is its own view.
- **PWA notes:** 3-col → single column (summary collapses); stepper scroll; upload = camera/file.
- **Multi-stage / multi-view:** Application wizard steps 1–6 = images 323–328.

---

### Image 324 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 2 Income
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (step 2 of 6)
- **Chrome:** Customer top-nav.
- **Purpose:** Income verification uploads.
- **Layout:** Same shell; centre step card = "Income verification" group (Latest 3 payslips / Bank statements (3 months) / Employment contract upload tiles).
- **Primary components:** stepper (step 2 active), upload tiles, persistent summary rail.
- **Actions:** Next/Back/Save draft; upload tiles.
- **States:** step persisted.
- **PWA notes:** as 323.
- **Multi-stage / multi-view:** sibling of 323/325–328.

---

### Image 325 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 3 References
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (step 3 of 6)
- **Chrome:** Customer top-nav.
- **Purpose:** Reference document uploads.
- **Layout:** Same shell; centre = "References" group (Employer / Previous landlord / Character reference tiles).
- **Primary components:** stepper (step 3), upload tiles, summary rail.
- **Actions:** Next/Back/Save draft; uploads.
- **States:** step persisted.
- **PWA notes:** as 323.
- **Multi-stage / multi-view:** sibling of 323/324/326–328.

---

### Image 326 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 4 Guarantor
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (step 4 of 6)
- **Chrome:** Customer top-nav.
- **Purpose:** Guarantor details and documents.
- **Layout:** Same shell; centre = "Guarantor" group (Guarantor details / Guarantor ID / Guarantor proof of income tiles).
- **Primary components:** stepper (step 4), upload tiles, summary rail (Guarantor = James Carter Pending).
- **Actions:** Next/Back/Save draft; uploads.
- **States:** step persisted.
- **PWA notes:** as 323.
- **Multi-stage / multi-view:** sibling of 323–325/327/328.

---

### Image 327 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 5 Documents
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (step 5 of 6; default landing step)
- **Chrome:** Customer top-nav.
- **Purpose:** Identity, Right to Rent and income document uploads.
- **Layout:** Same shell; centre = three upload groups — Identity & Right to Rent (Passport / Right to Rent proof), Income verification (Payslips / Bank statements / Employment contract), Additional documents (Proof of address / Other) — each a 2-col upload-tile grid with encryption subcopy.
- **Primary components:** stepper (step 5 active = wizard default), multi-group upload tiles, summary rail.
- **Actions:** Next (→ Review)/Back/Save draft; uploads.
- **States:** wizard defaults to this step.
- **PWA notes:** as 323.
- **Multi-stage / multi-view:** sibling of 323–326/328.

---

### Image 328 — `/customer/lets/applications/[id]/wizard` — Application wizard · Step 6 Review & Submit
- **Area / Persona:** Customer dashboard · tenancy application.
- **Route:** `/customer/lets/applications/[id]/wizard`  (step 6 of 6)
- **Chrome:** Customer top-nav.
- **Purpose:** Confirm details, accept terms, submit application.
- **Layout:** Same shell; centre = "Review & submit" group (Confirm all details / Accept terms / Submit application); primary action button label becomes **Submit**.
- **Primary components:** stepper (step 6), review tiles, summary/checklist rail (all checks complete).
- **Actions:** Submit (toast "Application submitted"); Back/Save draft.
- **States:** final step; submit toast.
- **PWA notes:** submit CTA sticky bottom.
- **Multi-stage / multi-view:** sibling of 323–327.

---

### Image 329 — `/customer/bookings` — Bookings · Overview view
- **Area / Persona:** Customer dashboard · bookings hub.
- **Route:** `/customer/bookings`  (default view=overview; `?view=` syncs URL)
- **Chrome:** Customer top-nav.
- **Purpose:** Manage all stays and lets; overview list view.
- **Layout:** Header (H1 + Export bookings) → 6 KPI tiles → tab bar (All bookings / Stays / Lets / Disputes(2) / Completed) + segmented **view switch** (Overview / Cards / Table / Map) → toolbar (search + type/location/dates/more filters + Sort) → 2-col `[1fr_360px]`: left = **OverviewView** list rows (image, status pill, property, ref, check-in/out, total) + pagination; right = Booking summary rail (counts, Need help links, Rebook promo).
- **Primary components:** KPI tiles, tabs, view switch, filter toolbar, overview list rows, summary rail.
- **Local nav / tabs / filters:** type tabs; view switch (Overview/Cards/Table/Map = images 329–332); filters; Disputes/Completed links.
- **Actions:** Export (toast); row select; open booking → `/customer/bookings/[id]`.
- **States:** seeded bookings; client tab + view state, URL sync.
- **PWA notes:** KPI strip scroll; view switch compact; rows 1-col.
- **Multi-stage / multi-view:** Bookings views — Overview (329), Cards (330), Table (331), Map (332).
