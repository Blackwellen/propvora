# Auth & onboarding — image index (block 200–299)

Area: **Auth & onboarding**. Image range used: **200–231** (32 images, 4 batch files).
Chrome: **Auth bare** for everything under `(auth)/*`; **Supplier sidebar** for the
three in‑workspace `/supplier/onboarding/*` pages. Light theme only (zero `dark:`).

| Image | Route (+ step) | Name | Batch |
|:----:|----------------|------|:----:|
| 200 | `/login` | Sign in (persona switch + form) | 01 |
| 201 | `/register` (step 0) | Create account — intent chooser | 01 |
| 202 | `/register?intent=operator\|supplier` (step 1) | Register form — business (+ Company) | 01 |
| 203 | `/register?intent=customer` (step 1) | Register form — customer (no Company) | 01 |
| 204 | `/register` (success) | Signup success — Check your email | 01 |
| 205 | `/forgot-password` | Request reset link — form | 01 |
| 206 | `/forgot-password` (success) | Reset link sent | 01 |
| 207 | `/reset-password` | Set new password — form | 01 |
| 208 | `/reset-password` (success) | Password updated | 01 |
| 209 | `/verify-2fa` | Two‑factor authentication (6‑digit OTP) | 01 |
| 210 | `/invite/[token]` (signed‑out) | Accept invitation — signed‑out | 02 |
| 211 | `/invite/[token]` (signed‑in) | Accept invitation — signed‑in | 02 |
| 212 | `/invite/[token]` (accepted) | Invitation accepted | 02 |
| 213 | `/invite/[token]` (error) | Invitation error states | 02 |
| 214 | `/onboarding` (step 1) | Operator onboarding — Welcome | 02 |
| 215 | `/onboarding` (step 2) | Operator onboarding — Business details | 02 |
| 216 | `/onboarding` (step 3) | Operator onboarding — Operation types | 02 |
| 217 | `/onboarding` (step 4) | Operator onboarding — Portfolio setup | 02 |
| 218 | `/onboarding` (step 5) | Operator onboarding — Demo variant | 02 |
| 219 | `/onboarding` (step 6) | Operator onboarding — Choose plan | 02 |
| 220 | `/onboarding` (step 7) | Operator onboarding — Review & create | 03 |
| 221 | `/onboarding` (step 8) | Operator onboarding — Creating workspace | 03 |
| 222 | `/onboarding/supplier` (step 1) | Supplier onboarding — Trade categories | 03 |
| 223 | `/onboarding/supplier` (step 2) | Supplier onboarding — Your business | 03 |
| 224 | `/onboarding/supplier` (step 3) | Supplier onboarding — Service area | 03 |
| 225 | `/onboarding/supplier` (step 4) | Supplier onboarding — Insurance | 03 |
| 226 | `/onboarding/supplier` (step 5) | Supplier onboarding — Quick wins | 03 |
| 227 | `/onboarding/supplier` (step 6, loading) | Supplier onboarding — Creating profile | 03 |
| 228 | `/onboarding/supplier` (step 6, success) | Supplier onboarding — Profile preview | 03 |
| 229 | `/supplier/onboarding` | In‑workspace setup — Get set up checklist | 03 |
| 230 | `/supplier/onboarding/readiness` | In‑workspace — First‑job readiness | 04 |
| 231 | `/supplier/onboarding/complete` | In‑workspace — Onboarding complete | 04 |

## Notes on wizard expansion
- **`/register`** = 4 images: intent chooser (201) + form business‑variant (202) + form customer‑variant (203, no Company field / "Email address" label) + success (204).
- **`/onboarding`** (operator) = 8 numbered step images 214–221, matching the `step` state machine (1 Welcome → 2 Business details incl. country/type/count → 3 Operation types → 4 Portfolio setup → 5 Demo variant [conditional] → 6 Plan → 7 Review → 8 Creating). Step 5 is skipped when the user doesn't pick demo data.
- **`/onboarding/supplier`** = 6 steps but **7 images** (222–228): step 6 splits into a loading state (227) and a profile‑preview success state (228).
- The three `/supplier/onboarding/*` pages live in the **supplier‑workspace** route group and render under the **Supplier sidebar**, not Auth bare.
```
