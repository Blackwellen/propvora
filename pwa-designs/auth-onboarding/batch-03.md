# Auth & onboarding · batch 03 · Images 220–229

Finishes the **operator onboarding** wizard (Images 220–221), covers the full
**supplier onboarding** 6‑step wizard (Images 222–228), and the first
**in‑workspace** supplier onboarding page (Image 229). The two public onboarding
wizards use **Chrome: Auth bare** (single centred card on `#F8FAFC`, logo + Back‑to‑home
top bar, internal step indicator). Image 229 switches to **Chrome: Supplier sidebar**.
Light theme only.

---

### Image 220 — `/onboarding` — Operator onboarding · Step 7: Review & create
- **Area / Persona:** Operator onboarding · confirm before provisioning.
- **Route:** `/onboarding`  (step `7`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Summarise all choices and confirm workspace creation.
- **Layout:** "Review & create" → bordered summary list (label / value / **Edit**) → guided‑tour opt‑in toggle → **Create my workspace** primary button.
- **Primary components:** **summary rows** (Workspace name, Country, Business type, Portfolio size, Operation types, Starting with [demo variant / manual], Plan + price + "14‑day trial") each with an inline **Edit** jumping back to its step; **"Show me around" guided‑tour** toggle (default on, persisted to `propvora.help.enabled`); submit error banner slot; **Create my workspace** (ArrowRight).
- **Local nav / tabs / filters:** Back; per‑row Edit deep‑links to steps 2/3/4/6.
- **Actions:** Create my workspace → Step 8 (kicks off `createWorkspace`).
- **States:** review (editable); error banner if creation failed (returns here from Step 8).
- **PWA notes:** summary list scrolls; Edit links are tap‑sized; sticky Back bar (no Continue on Step 7).
- **Multi-stage / multi-view:** Step 7 of 8.

---

### Image 221 — `/onboarding` — Operator onboarding · Step 8: Creating workspace
- **Area / Persona:** Operator onboarding · provisioning / finishing.
- **Route:** `/onboarding`  (step `8`)
- **Chrome:** Auth bare (centred card; **no step indicator**, no nav buttons).
- **Purpose:** Show progress while the workspace is created, then redirect.
- **Layout:** Centered: large spinner ring → "Setting up your workspace" → "This will only take a moment…" → 5‑item animated progress checklist → "redirected automatically" hint.
- **Primary components:** `Loader2` hero spinner; **progress steps** (Creating your workspace… / Setting up your portfolio… / Injecting demo data… / Finalising your account… / Almost ready…) that flip from spinner → emerald check on a 1.2s timer; auto `router.push('/app')` after ~4s.
- **Actions:** none (auto‑redirect; on failure returns to Step 7 with error).
- **States:** animating progress; terminal redirect; error → back to Step 7.
- **PWA notes:** full‑height centered; no inputs; keep spinner visible (no offline cache of this step).
- **Multi-stage / multi-view:** Step 8 of 8 (terminal). Supplier intent uses Images 222–228 instead.

---

### Image 222 — `/onboarding/supplier` — Supplier onboarding · Step 1: Trade categories
- **Area / Persona:** Supplier onboarding wizard (6 steps) · new trade/supplier.
- **Route:** `/onboarding/supplier`  (step `1`)
- **Chrome:** Auth bare (centred card on `#F8FAFC`, `max-w-lg`; logo + Back‑to‑home; step indicator on steps 1–5).
- **Purpose:** Capture which trades the supplier offers.
- **Layout:** "Welcome, {firstName}!" → "What trades or services do you provide?" → 2/3‑col toggle grid.
- **Primary components:** 11 **trade‑category** toggles (Cleaning, Plumbing, Electrical, HVAC, Landscaping, Security, Painting, Carpentry, Gas Engineer, Locksmith, Other); "at least one" validation.
- **Local nav / tabs / filters:** Back (hidden on Step 1) / Continue footer (sticky on mobile).
- **Actions:** Continue → ≥1 category → Step 2; "Skip setup and go to dashboard" → `/supplier`.
- **States:** checked = blue tint; error if none.
- **PWA notes:** grid collapses to 2‑col on phones; toggle chips thumb‑sized.
- **Multi-stage / multi-view:** Step 1 of 6 → Images 223–228.

---

### Image 223 — `/onboarding/supplier` — Supplier onboarding · Step 2: Your business
- **Area / Persona:** Supplier onboarding · business identity.
- **Route:** `/onboarding/supplier`  (step `2`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Capture trading name, experience, team size.
- **Layout:** "Your business" → **Business/trading name** `Input` (Building2) → **Years in business** `Input` → **Team size** 2‑col pill grid.
- **Primary components:** business name input (required); years‑in‑business input; 4 **staff‑band** pills (Solo (just me), 2–5 people, 5–20 people, 20+ people); validation (name + band required).
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → Step 3.
- **States:** field errors; selected band blue.
- **PWA notes:** text keyboard; pills keep 2‑col.
- **Multi-stage / multi-view:** Step 2 of 6.

---

### Image 224 — `/onboarding/supplier` — Supplier onboarding · Step 3: Service area
- **Area / Persona:** Supplier onboarding · coverage.
- **Route:** `/onboarding/supplier`  (step `3`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Set base location, travel radius, emergency availability.
- **Layout:** "Your service area" → **Base location** `Input` (MapPin) → **Coverage radius** wrap‑pill group → **Accept emergency callouts** amber toggle row.
- **Primary components:** base‑location input (required); 5 **radius** pills (5/10/25/50/100 km, one required); **emergency callout** toggle (amber Zap, "higher rates apply" copy).
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → Step 4.
- **States:** errors on location/radius; emergency toggle amber when on.
- **PWA notes:** radius pills wrap; location uses text keyboard (no map picker).
- **Multi-stage / multi-view:** Step 3 of 6.

---

### Image 225 — `/onboarding/supplier` — Supplier onboarding · Step 4: Insurance
- **Area / Persona:** Supplier onboarding · compliance gate.
- **Route:** `/onboarding/supplier`  (step `4`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Confirm public liability insurance (required to list).
- **Layout:** "Insurance confirmation" → large emerald confirm toggle → conditional expiry date field → blue reminder note.
- **Primary components:** **"I confirm I hold valid public liability insurance"** toggle (ShieldCheck, min £1,000,000 copy, required); conditional **policy expiry** date `Input` (optional); blue "we'll remind you before expiry" box.
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → requires confirmation checked → Step 5.
- **States:** unconfirmed → error; confirmed → emerald + reveals date field.
- **PWA notes:** native date picker for expiry; large confirm tap target.
- **Multi-stage / multi-view:** Step 4 of 6.

---

### Image 226 — `/onboarding/supplier` — Supplier onboarding · Step 5: Quick wins
- **Area / Persona:** Supplier onboarding · finishing questions.
- **Route:** `/onboarding/supplier`  (step `5`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Capture service count and marketplace listing choice.
- **Layout:** "Almost done!" → submit‑error slot → **How many services** 2‑col pill grid → **List publicly?** two choice cards → conditional marketplace‑terms note.
- **Primary components:** 4 **service‑count** pills (1–2, 3–5, 5–10, 10+); 2 **listing** choice cards (Yes, list me publicly / No, invite only — each with sub‑copy); conditional **Marketplace Supplier Terms** acceptance note (when public). Footer button label becomes **Create my profile**.
- **Local nav / tabs / filters:** Back / Create my profile.
- **Actions:** Create my profile → validate (service count + yes/no required) → Step 6 (provisioning).
- **States:** errors; selected pill/card blue; terms note shown only when "list publicly".
- **PWA notes:** choice cards stack on narrow; pills 2‑col.
- **Multi-stage / multi-view:** Step 5 of 6.

---

### Image 227 — `/onboarding/supplier` — Supplier onboarding · Step 6: Creating profile
- **Area / Persona:** Supplier onboarding · provisioning.
- **Route:** `/onboarding/supplier`  (step `6`, pre‑result)
- **Chrome:** Auth bare (centred card; no step indicator, no nav).
- **Purpose:** Show progress while the supplier workspace is created.
- **Layout:** Centered spinner ring → "Setting up your supplier profile" → "This will only take a moment…" → 4‑item animated progress checklist.
- **Primary components:** `Loader2` hero; **progress steps** (Creating your supplier profile… / Setting up your workspace… / Configuring your service area… / Almost ready…) flipping spinner → emerald check on a 1.2s timer; calls `createWorkspace` then shows Image 228.
- **Actions:** none (on error returns to Step 5 with banner).
- **States:** animating; success → Image 228; error → Step 5.
- **PWA notes:** full‑height centered, no inputs.
- **Multi-stage / multi-view:** Step 6 (loading) → Image 228 (success). 

---

### Image 228 — `/onboarding/supplier` — Supplier onboarding · Step 6: Profile preview (success)
- **Area / Persona:** Supplier onboarding · success + profile preview.
- **Route:** `/onboarding/supplier`  (step `6`, after `workspaceId` set)
- **Chrome:** Auth bare (centred card).
- **Purpose:** Celebrate completion and preview the public supplier card.
- **Layout:** Wrench tile → "You're all set!" → **profile preview card** → **Start accepting jobs** button → dashboard hint.
- **Primary components:** amber Wrench icon; **preview card** (initial avatar, business name, top‑3 trades, location + radius, "Insurance confirmed", "Emergency callouts", "No reviews yet", and a "Listed on public marketplace" chip when public); primary **Start accepting jobs** → `/supplier`.
- **Actions:** Start accepting jobs → `/supplier`.
- **States:** terminal success; preview reflects entered data.
- **PWA notes:** preview card single column; CTA full width.
- **Multi-stage / multi-view:** terminal success of the supplier wizard (Images 222–227).

---

### Image 229 — `/supplier/onboarding` — In‑workspace supplier setup (Get set up)
- **Area / Persona:** Supplier (in‑app) · resumable 9‑step setup checklist.
- **Route:** `/supplier/onboarding`
- **Chrome:** **Supplier sidebar** (`SupplierWorkspaceShell` — floating navy sidebar + TopNavigation; `MobileTopBar` "Onboarding" with % subtitle on mobile). NOT Auth bare.
- **Purpose:** Drive profile completion from inside the workspace and launch the guided wizard.
- **Layout:** `SupplierPageHeader` ("Get set up" + **Guided setup** action) → progress `SupplierCard` (X of 9 + % bar + "Next: …" Continue) → checklist `SupplierCard` (9 rows).
- **Primary components:** **Guided setup** button (opens `OnboardingWizard` modal); **progress bar** + next‑step CTA; **9 step rows** (Account type, Business details, Service categories, Service areas, Services & packages, Availability, Verification, Payments, Marketplace profile) each with done/incomplete state (CheckCircle2 vs Circle), icon tile, **Open** link to the relevant `/supplier/*` page, and desktop **Mark done** (calls `/api/supplier/onboarding` advance). Completion inferred from the live `SupplierProfile`.
- **Local nav / tabs / filters:** none; rows deep‑link across the supplier workspace.
- **Actions:** Guided setup (modal); Continue → next step page; per‑row Open / Mark done.
- **States:** loading (`SupplierLoadingState` rows) / per‑step done vs incomplete / amber banner when the onboarding service is unavailable (503/404) / network error banner.
- **PWA notes:** `MobileTopBar` shows live %; rows are tappable list items; wizard opens as a full‑screen sheet/modal on mobile.
- **Multi-stage / multi-view:** companion to readiness (Image 230) and complete (Image 231); the **Guided setup** modal mirrors the public supplier wizard (Images 222–228).

---
```
