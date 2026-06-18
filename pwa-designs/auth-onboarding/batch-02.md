# Auth & onboarding · batch 02 · Images 210–219

Covers invite acceptance (Chrome: Auth bare, centred card) and the start of the
**operator onboarding** 8‑step wizard (Chrome: Auth bare, single centred card on
`#F8FAFC` — no photo panel; logo + Back‑to‑home top bar; step indicator inside the
card; numbered dot rail on desktop, compact % progress bar on mobile). Light theme only.

---

### Image 210 — `/invite/[token]` — Accept invitation (signed‑out)
- **Area / Persona:** Auth · invited teammate, not yet authenticated.
- **Route:** `/invite/[token]`  (dynamic param: `token`)
- **Chrome:** Auth bare — `InviteClient` own `Shell` (gradient bg, centered logo above a single white rounded‑3xl card `max-w-[440px]`). `robots: noindex`.
- **Purpose:** Show the invite and route the user to sign up / sign in to accept.
- **Layout:** Building2 icon tile → "You've been invited" → "Join {workspaceName} on Propvora." → **role chip row** (ShieldCheck + "Your role" + role pill) → "sent to {email}" hint → CTA stack.
- **Primary components:** workspace name, **role badge** (Owner/Admin/Member/Viewer/Finance/Supplier), invited‑email line; primary **Create account & join** → `/register?invite={token}`; outline **I already have an account** → `/login?redirectTo=/invite/{token}`.
- **Actions:** Create account & join / I already have an account.
- **States:** signed‑out variant (server resolved `details.status === "ok"`, client `authChecked && !authed`).
- **PWA notes:** single column; large CTAs; card stays centered.
- **Multi-stage / multi-view:** siblings — signed‑in (Image 211), accepted (Image 212), error (Image 213).

---

### Image 211 — `/invite/[token]` — Accept invitation (signed‑in)
- **Area / Persona:** Auth · invited teammate, already authenticated.
- **Route:** `/invite/[token]`
- **Chrome:** Auth bare (`InviteClient` Shell).
- **Purpose:** One‑tap accept for a signed‑in account.
- **Layout:** Same invite card as Image 210 but the CTA collapses to a single primary **Accept invitation** button (ArrowRight), plus inline error banner slot.
- **Primary components:** workspace name, role chip, invited‑email hint, primary **Accept invitation** (loading "Joining…").
- **Actions:** Accept → `acceptInvite(token)` → if `requiresAuth` bounce to register; on success → accepted view (Image 212) → `/app`.
- **States:** ready / accepting ("Joining…") / inline error banner ("couldn't accept this invitation").
- **PWA notes:** single column; one prominent button.
- **Multi-stage / multi-view:** sibling of Images 210 / 212 / 213.

---

### Image 212 — `/invite/[token]` — Invitation accepted (success)
- **Area / Persona:** Auth · invite confirmed.
- **Route:** `/invite/[token]` (in‑component accepted view)
- **Chrome:** Auth bare (`InviteClient` Shell).
- **Purpose:** Confirm membership and route into the workspace.
- **Layout:** Emerald check circle → "You're in" → "You've joined {workspaceName}. Taking you to the workspace…" → spinner.
- **Primary components:** success icon, body, `Loader2` spinner; auto‑redirects to `/app` after ~1.4s.
- **Actions:** none (auto‑redirect).
- **States:** terminal success.
- **PWA notes:** single column.
- **Multi-stage / multi-view:** success state of Images 210/211.

---

### Image 213 — `/invite/[token]` — Invitation error states
- **Area / Persona:** Auth · invalid / expired / revoked / already‑accepted invite.
- **Route:** `/invite/[token]`
- **Chrome:** Auth bare (`InviteClient` Shell).
- **Purpose:** Explain why the invite can't be used and offer a path forward.
- **Layout:** Red AlertCircle circle → status title → status body → **Go to sign in** primary button + "Back to home" link.
- **Primary components:** error icon, mapped copy for `not_found` / `expired` / `revoked` / `already_accepted` / generic `error`; primary Go to sign in → `/login`; Back to home.
- **Actions:** Go to sign in; Back to home.
- **States:** one design, 5 copy variants (server `details.status`).
- **PWA notes:** single column.
- **Multi-stage / multi-view:** error branch of the invite flow (siblings 210–212).

---

### Image 214 — `/onboarding` — Operator onboarding · Step 1: Welcome
- **Area / Persona:** Operator onboarding wizard (8 steps) · new property manager.
- **Route:** `/onboarding`  (step state `1`)
- **Chrome:** Auth bare (centred card on `#F8FAFC`, `max-w-lg`; logo + Back‑to‑home top bar; **no step indicator on Step 1**).
- **Purpose:** Welcome the new operator and frame the setup.
- **Layout:** Centered: Sparkles tile → "Welcome to Propvora, {firstName}!" → intro copy → 3 feature tiles (Portfolio management / Tenant & lease tracking / Financials & reports) → **Get started** primary button.
- **Primary components:** welcome icon, headline (pulls first name from Supabase user metadata), 3 mini feature cards, **Get started** (→ Step 2). Footer "Skip setup and go to dashboard" link below the card.
- **Local nav / tabs / filters:** wizard step machine (resume from `localStorage propvora_onboarding_progress`).
- **Actions:** Get started → Step 2; Skip → `/app`.
- **States:** static welcome (name optional).
- **PWA notes:** single‑column card; mobile shows compact step bar from Step 2; sticky bottom nav bar appears Steps 2–7.
- **Multi-stage / multi-view:** Step 1 of 8 → Images 215–221.

---

### Image 215 — `/onboarding` — Operator onboarding · Step 2: Business details
- **Area / Persona:** Operator onboarding · profile basics.
- **Route:** `/onboarding`  (step `2`)
- **Chrome:** Auth bare (centred card; step indicator visible — dot rail / mobile % bar).
- **Purpose:** Capture workspace name, country, business type, portfolio size.
- **Layout:** "Your business details" heading → **Workspace name** `Input` (prefilled "{FirstName}'s Portfolio", hint) → **Country** `select` (20 countries, sets locale/currency/date format) → **Business type** 2‑col selectable grid → **Portfolio size** wrap‑pill group.
- **Primary components:** workspace name input; country dropdown (GB default); 7 **business‑type** pills (Individual investor, Portfolio operator, Property manager, BTL landlord, Rent‑to‑rent, HMO operator, Other); 5 **property‑count** pills (None yet, 1–5, 6–20, 21–50, 50+); validation errors inline.
- **Local nav / tabs / filters:** Back / Continue footer (sticky on mobile).
- **Actions:** Continue → validate (name + type + count required) → Step 3.
- **States:** field errors; selected pill = blue fill.
- **PWA notes:** country `select` uses native picker; business‑type grid keeps 2‑col; sticky Back/Continue bar with safe‑area padding.
- **Multi-stage / multi-view:** Step 2 of 8.

---

### Image 216 — `/onboarding` — Operator onboarding · Step 3: Operation types
- **Area / Persona:** Operator onboarding · operation profiles.
- **Route:** `/onboarding`  (step `3`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Multi‑select which operation models the operator runs.
- **Layout:** "Operation types" heading → vertical list of 13 toggle rows (checkbox + label, selected = blue tint).
- **Primary components:** 13 **operation‑profile** toggles (Long‑Term Let, Rent‑to‑Rent, HMO, Student Let, Serviced Accommodation, Holiday Let, Build‑to‑Rent, Social Housing, Commercial, Mixed Use, Refinancing, Development/Flip, Co‑Living); "at least one" validation.
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → requires ≥1 selection → Step 4.
- **States:** checked rows blue; error if none chosen.
- **PWA notes:** full‑width rows, easy thumb toggles; list scrolls within card.
- **Multi-stage / multi-view:** Step 3 of 8.

---

### Image 217 — `/onboarding` — Operator onboarding · Step 4: Portfolio setup
- **Area / Persona:** Operator onboarding · starting data choice.
- **Route:** `/onboarding`  (step `4`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Choose how to populate the workspace.
- **Layout:** "Portfolio setup" → 3 stacked option rows.
- **Primary components:** **Import my properties** — honest disabled row ("Not in setup" pill, inline link to switch to manual); **Add properties manually** radio row; **Start with demo data** radio row ("Recommended" blue pill, "realistic sample data… removable" copy); validation requires a choice.
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → if choice = demo go Step 5, else **skip to Step 6** (plan).
- **States:** selected radio blue; error if none.
- **PWA notes:** large radio rows; demo "Recommended" badge prominent.
- **Multi-stage / multi-view:** Step 4 of 8 (branches: demo → Step 5; manual → Step 6).

---

### Image 218 — `/onboarding` — Operator onboarding · Step 5: Demo variant
- **Area / Persona:** Operator onboarding · demo dataset pick (only if demo chosen).
- **Route:** `/onboarding`  (step `5`, conditional)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Pick which seeded demo dataset to load.
- **Layout:** "Choose your demo workspace" → 4 radio cards → amber note that demo data is labelled and removable.
- **Primary components:** 4 **demo‑variant** radio cards (Full demo workspace, Rent‑to‑rent focused, HMO focused, Serviced accommodation — each with description); amber Database info callout.
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue → Step 6 (Back from Step 6 skips here if not demo).
- **States:** selected card blue; default none (defaults to "full" at creation).
- **PWA notes:** stacked radio cards; info note wraps.
- **Multi-stage / multi-view:** Step 5 of 8 (skipped when portfolio choice ≠ demo).

---

### Image 219 — `/onboarding` — Operator onboarding · Step 6: Choose plan
- **Area / Persona:** Operator onboarding · plan selection (trial).
- **Route:** `/onboarding`  (step `6`)
- **Chrome:** Auth bare (centred card; step indicator).
- **Purpose:** Pick a plan for the 14‑day no‑card trial.
- **Layout:** Centered "Choose your plan" + "14‑day free trial — no card required" → 3 plan radio rows → blue "not charged today" note → "I'll decide later — skip" link.
- **Primary components:** 3 **plan** rows (Starter £29, Pro £79 "Most popular", Business £149 — radio + name + 2‑feature summary + price/mo); blue trial reassurance box; skip link.
- **Local nav / tabs / filters:** Back / Continue.
- **Actions:** Continue (or skip) → Step 7. Pro is default selected.
- **States:** selected plan blue ring; "Most popular" badge on Pro.
- **PWA notes:** plan rows stack full width; price right‑aligned.
- **Multi-stage / multi-view:** Step 6 of 8.

---
```
