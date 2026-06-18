# Auth & onboarding · batch 01 · Images 200–209

Area: **Auth & onboarding**. Unless noted, every page uses **Chrome: Auth bare**
(centered card on the gradient `#EFF6FF → #F8FAFC → #EEF2FF`, Propvora logo top‑left,
**Back to home** link top‑right, no app nav, light theme only — zero `dark:`).

Two structural variants of Auth bare exist:
- **Split two‑panel** (login, register, both onboarding wizards, invite): left = form/card,
  right = full‑height property photo (`/auth1.png`, `/auth2.png`) with floating glass
  feature cards + "© 2026 Blackwellen Ltd, t/a Propvora." The right panel is `hidden lg:block`
  (mobile shows the form only). Onboarding wizards centre a single card on `#F8FAFC` (no photo).
- **Simple centred card** (forgot‑password, reset‑password, verify‑2fa): the shared
  `AuthShell` renders one narrow centred card; copy is icon‑topped + title + sub.

---

### Image 200 — `/login` — Sign in (persona switch + form)
- **Area / Persona:** Auth · all personas (one account, three workspaces).
- **Route:** `/login`  (query: `redirectTo`, allow‑listed)
- **Chrome:** Auth bare (split two‑panel; left form, right photo `/auth1.png` + 3 glass cards: Enterprise‑grade security / Always available / Built for teams).
- **Purpose:** Authenticate and route the same account into the chosen workspace.
- **Layout:** White rounded‑3xl card, `max-w-[420px]`. Heading "Welcome back" + persona‑specific subhead → persona segmented control → error banner (conditional) → form → divider → disabled Google → footer link → trust footer.
- **Primary components:** 3‑way **persona tablist** (Customer / Property Manager / Supplier, icon + label, active = white pill); email `Input` (Mail icon, autofocus); password `Input` (Lock icon, show/hide eye); **Remember me** checkbox; primary **Sign in** button (full width, `h-11`); "or" divider; disabled **Continue with Google** ("Soon" pill); "Don't have an account? Create one" → `/register?intent={persona}`; Shield trust line with Terms / Privacy links.
- **Local nav / tabs / filters:** persona segmented control (Customer default for new visitors; last‑used persona remembered in `localStorage propvora.login.persona`). "Forgot password?" link → `/forgot-password`.
- **Actions:** Submit → Supabase `signInWithPassword` (after `/api/auth/rate-check` gate) → hard `window.location.assign` to persona destination (`/user` · `/property-manager` · `/supplier`), unless an allow‑listed `redirectTo` for the same persona wins.
- **States:** idle / submitting ("Signing in…") / auth error banner (mapped: invalid credentials, unconfirmed email, throttled, not found) / password visible vs hidden. Persona subhead text changes per tab.
- **PWA notes:** right photo panel hidden; form full‑width single column; email keyboard for email field; 44px tap targets; persona pills stay 3‑across.
- **Multi-stage / multi-view:** subhead + post‑login destination vary by the 3 persona tabs (one screen, three text states).

---

### Image 201 — `/register` — Create account (intent chooser, Step 0)
- **Area / Persona:** Auth · prospective signups (choose role).
- **Route:** `/register`  (no `intent` query → chooser)
- **Chrome:** Auth bare (split two‑panel; right photo `/auth2.png` shows the **default** feature card "The smarter way to manage property" + 6 bullets).
- **Purpose:** Let the user pick how they'll use Propvora before showing the form.
- **Layout:** White rounded‑3xl card, `max-w-[480px]`. Centered heading "Create your account" + "Choose how you want to use Propvora" → 3 stacked selectable cards → "Already have an account? Sign in".
- **Primary components:** 3 **intent cards** (full‑width buttons, ChevronRight): **Book a Stay** (Home, emerald accent — browse verified UK properties / book directly / track trips), **Offer Services** (Wrench, amber accent — list trade / receive local jobs / fast payments), **Manage Properties** (LayoutDashboard, blue accent — all‑in‑one workspace / AI copilot / supplier & tenant mgmt). Each: icon tile, title, tagline, 3 check bullets.
- **Local nav / tabs / filters:** none (selection advances to Image 202/203).
- **Actions:** Select card → `setStep(1)` + `router.replace(/register?intent=<intent>)`; Sign in → `/login`.
- **States:** static chooser; hover lifts card border/shadow.
- **PWA notes:** cards stack naturally (already vertical); large tap rows; right photo hidden.
- **Multi-stage / multi-view:** Step 0 of the register flow → Step 1 = form (Images 202/203) → success (Image 204).

---

### Image 202 — `/register?intent=operator|supplier` — Register form (business)
- **Area / Persona:** Auth · operator or supplier signup.
- **Route:** `/register?intent=operator` (or `supplier`)
- **Chrome:** Auth bare (split two‑panel; right photo `/auth2.png` shows intent‑specific feature card — operator: "Property management, simplified" + 6 features; supplier: "Grow your trade business" + 6 features).
- **Purpose:** Capture credentials for a business (non‑customer) account.
- **Layout:** White rounded‑3xl card `max-w-[440px]`. **Back** link → chooser → intent heading/sub → error banner (conditional) → form → divider → disabled Google → "Sign in".
- **Primary components:** **Full name** + **Company** side‑by‑side (2‑col grid — Company only shown for non‑customer); **Work email** `Input`; password `Input` with **strength meter** (5 bars) + requirement chips (8+ chars / 1 number / 1 uppercase, turn emerald when met); **Confirm password** `Input`; **Terms** checkbox (links to Terms / Privacy); primary **Create account**; "or" divider; disabled Google.
- **Local nav / tabs / filters:** Back to chooser; intent reflected in URL.
- **Actions:** Submit → rate‑check gate → Supabase `signUp` (metadata full_name; emailRedirectTo `/auth/callback?intent=…`) → if live session: welcome email + `resolveLoginDestination(intent)` hard‑nav; else → success (Image 204).
- **States:** idle / submitting ("Creating account…") / mapped error banner (already exists, weak password, throttled) / password strength Weak→Very strong / chip met vs unmet.
- **PWA notes:** name+company stack to one column on narrow widths is NOT automatic (2‑col grid) — designer should single‑column on mobile; numeric/password keyboards; right photo hidden.
- **Multi-stage / multi-view:** business variant of the form; **customer variant = Image 203** (no Company, "Email address" label). Preceded by Image 201, followed by Image 204.

---

### Image 203 — `/register?intent=customer` — Register form (customer)
- **Area / Persona:** Auth · guest/customer signup.
- **Route:** `/register?intent=customer`
- **Chrome:** Auth bare (split two‑panel; right photo card "Book stays with confidence" + 6 customer features).
- **Purpose:** Capture credentials for a guest account.
- **Layout:** Identical card to Image 202 but heading "Create your guest account"; **no Company field** (Full name spans full width); email label = "Email address" (not "Work email").
- **Primary components:** Full name `Input`; Email `Input`; password `Input` + strength meter + chips; Confirm password; Terms checkbox; Create account; disabled Google; "Sign in".
- **Local nav / tabs / filters:** Back to chooser.
- **Actions:** Submit → same `signUp` flow; live‑session customers route to `/user`.
- **States:** as Image 202.
- **PWA notes:** single‑column already (no 2‑col name/company row); right photo hidden.
- **Multi-stage / multi-view:** customer variant of the register form (sibling of Image 202).

---

### Image 204 — `/register` — Signup success (Check your email)
- **Area / Persona:** Auth · post‑signup (email‑confirmation ON).
- **Route:** `/register` (in‑component success view)
- **Chrome:** Auth bare — **full white screen**, single centered column `max-w-[400px]` (no card, no photo).
- **Purpose:** Tell the user to verify via the emailed link.
- **Layout:** Centered: emerald check circle → "Check your email" → "We've sent a verification link to {email}…" → spam‑folder hint → "Back to sign in" link.
- **Primary components:** success icon, headline, body with the entered email, helper line, `ArrowLeft` "Back to sign in" → `/login`.
- **Actions:** Back to sign in.
- **States:** terminal success (only shown when `signUp` returns no live session).
- **PWA notes:** already single‑column; full‑bleed white; large icon.
- **Multi-stage / multi-view:** terminal state of the register flow (Images 201–203).

---

### Image 205 — `/forgot-password` — Request reset link (form)
- **Area / Persona:** Auth · account recovery.
- **Route:** `/forgot-password`
- **Chrome:** Auth bare (simple centred `AuthShell` card — single column, no photo panel).
- **Purpose:** Email a password‑reset link (enumeration‑safe).
- **Layout:** Centered icon‑topped header: Mail tile → "Forgot your password?" → "Enter your email and we'll send you a reset link." → error banner (conditional) → form → "Back to sign in".
- **Primary components:** Email `Input` (Mail icon, autofocus); primary **Send reset link** button; `ArrowLeft` Back to sign in.
- **Actions:** Submit → rate‑check gate ("password-reset") → Supabase `resetPasswordForEmail` (redirectTo `/reset-password`) → always shows success (Image 206) to prevent enumeration.
- **States:** idle / submitting ("Sending reset link…") / throttle error banner.
- **PWA notes:** single column; email keyboard.
- **Multi-stage / multi-view:** form view → success view (Image 206).

---

### Image 206 — `/forgot-password` — Reset link sent (success)
- **Area / Persona:** Auth · account recovery confirmation.
- **Route:** `/forgot-password` (in‑component success view)
- **Chrome:** Auth bare (centred card).
- **Purpose:** Confirm the (enumeration‑safe) reset email was "sent".
- **Layout:** Emerald check circle → "Check your inbox" → "If an account exists for {email}, we've sent a password reset link…" → **Send again** outline button → "Back to sign in".
- **Primary components:** success icon, body with submitted email, outline **Send again** (returns to form), Back to sign in.
- **Actions:** Send again → back to Image 205; Back to sign in → `/login`.
- **States:** terminal success.
- **PWA notes:** single column.
- **Multi-stage / multi-view:** success state of Image 205.

---

### Image 207 — `/reset-password` — Set new password (form)
- **Area / Persona:** Auth · password reset (arrived via emailed link).
- **Route:** `/reset-password`
- **Chrome:** Auth bare (simple centred `AuthShell` card).
- **Purpose:** Set a new password on a recovery session.
- **Layout:** Lock icon tile → "Set a new password" → "Choose a strong password…" → error banner (conditional) → form → "Back to sign in".
- **Primary components:** **New password** `Input` (Lock, show/hide eye, hint "Min. 8 characters, one uppercase letter, one number"); **Confirm new password** `Input` (eye); primary **Update password** button; Back to sign in.
- **Actions:** Submit → Supabase `updateUser({ password })` → success (Image 208) then auto‑redirect to `/login` after 3s.
- **States:** idle / submitting ("Updating password…") / error banner (same_password, weak_password, expired link).
- **PWA notes:** single column; password keyboards.
- **Multi-stage / multi-view:** form → success (Image 208).

---

### Image 208 — `/reset-password` — Password updated (success)
- **Area / Persona:** Auth · reset confirmation.
- **Route:** `/reset-password` (in‑component success view)
- **Chrome:** Auth bare (centred card).
- **Purpose:** Confirm change and bounce to sign in.
- **Layout:** Emerald check circle → "Password updated" → "…Redirecting you to sign in…" → primary **Sign in now** button (full width).
- **Primary components:** success icon, body, **Sign in now** → `/login`.
- **Actions:** Sign in now (also auto‑redirects after 3s).
- **States:** terminal success.
- **PWA notes:** single column.
- **Multi-stage / multi-view:** success state of Image 207.

---

### Image 209 — `/verify-2fa` — Two‑factor authentication (OTP)
- **Area / Persona:** Auth · MFA challenge after sign‑in.
- **Route:** `/verify-2fa`  (query: `redirectTo`, same‑origin only)
- **Chrome:** Auth bare (simple centred `AuthShell` card).
- **Purpose:** Verify the 6‑digit TOTP code from the user's authenticator app.
- **Layout:** ShieldCheck tile → "Two‑factor authentication" → "Enter the 6‑digit code…" → error banner (conditional) → 6 OTP boxes → Verify button → resend row → "Back to sign in".
- **Primary components:** **6‑box OTP input** (numeric inputmode, auto‑advance, paste‑fill, backspace/arrow nav, filled box = blue ring); primary **Verify code** (disabled until 6 digits); **Resend code** link with 60s cooldown; Back to sign in.
- **Actions:** Verify → Supabase `mfa.listFactors` → `mfa.challenge` → `mfa.verify` → `router.push(redirectTo)` (default `/property-manager`). Resend → 60s cooldown + "open your authenticator app" hint (TOTP has no true resend).
- **States:** idle / verifying ("Verifying…") / mapped error (rejected code → boxes cleared + refocus, expired challenge) / resend cooldown countdown.
- **PWA notes:** OTP boxes sized for thumbs; `one-time-code` autofill on first box pulls SMS/app codes; numeric keyboard; caret hidden.
- **Multi-stage / multi-view:** single screen (no sibling steps).

---
```
