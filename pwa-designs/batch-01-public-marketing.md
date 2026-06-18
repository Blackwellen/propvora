# Batch 01 — Public Marketing (core) · Images 1–10

All pages use **Chrome: Public** (`PublicNav` + `PublicFooter`). Light theme,
sticky top nav, full-width sections, gradient `#EFF6FF → #F8FAFC → #EEF2FF`.
Signed-in visitors see **Go to app** in the nav instead of Log in / Get started.

---

### Image 1 — `/` — Homepage
- **Area / Persona:** Public marketing · all visitors.
- **Route:** `/`
- **Chrome:** Public.
- **Purpose:** Convert visitors; show the platform breadth (operations + marketplace).
- **Layout:** Stacked full-width sections, each edge-to-edge with centered max‑width content.
- **Primary components (in order):**
  1. `HeroSection` — headline, subcopy, dual CTA (Get started / Watch walkthrough), product visual.
  2. `SocialProofBar` — logo/stat strip.
  3. `FeaturesGrid` — icon+title+blurb grid.
  4. `OperatingModesSection` — operator-type modes (portfolio/PM/rent-to-rent/HMO).
  5. `BuiltForSection` — audience personas.
  6. `ToolsSection` — tool showcase.
  7. `MarketplaceTeaser` — stays/suppliers/services teaser.
  8. `WhyTeamsSection` — value props.
  9. `PricingTeaser` — plan cards mini + link to /pricing.
  10. `TestimonialsSection` — quotes/cards.
  11. `CtaSection` — closing CTA band.
- **Local nav / tabs / filters:** none (scroll page).
- **Actions:** Get started → `/register`; Log in → `/login`; section CTAs to /pricing, /features, /stays.
- **States:** static; nav swaps to "Go to app" when authenticated.
- **PWA notes:** install prompt candidate; hero CTA sticky on mobile; lazy‑load below‑fold sections; collapse nav to hamburger.
- **Multi-stage / multi-view:** none.

---

### Image 2 — `/about` — About
- **Area / Persona:** Public marketing.
- **Route:** `/about`
- **Chrome:** Public.
- **Purpose:** Company story, mission, entity trust (Blackwellen Ltd t/a Propvora).
- **Layout:** Hero + narrative sections (mission, values, story, team/entity), CTA band.
- **Primary components:** intro hero, value cards, company/entity facts block (Co 16482166, ICO ZC160806), CTA.
- **Actions:** Get started; Contact link.
- **States:** static.
- **PWA notes:** single-column on mobile; large type scales down.

---

### Image 3 — `/features` — Features
- **Area / Persona:** Public marketing.
- **Route:** `/features`
- **Chrome:** Public.
- **Purpose:** Deep feature tour across the whole product.
- **Layout:** `FeaturesHero` then alternating feature sections (image/text).
- **Primary components (sections):** `FeaturesHero`, `OperatingProfilesSection`, `AiCopilotSection`, `ComplianceLegalSection`, `AccountingInvoicesSection`, `WorkingWithTeamsSection`, `PortalsSection`, `WorkManagementSection`, `SchedulingSection`, `SaveContactsSection` (+ marketplace/financials sections), closing CTA.
- **Actions:** per‑section "Learn more" / Get started.
- **States:** static.
- **PWA notes:** each alternating section stacks vertically; consider in‑page anchor chips for jump nav on mobile.

---

### Image 4 — `/pricing` — Pricing
- **Area / Persona:** Public marketing · `PricingClient` (interactive).
- **Route:** `/pricing`
- **Chrome:** Public.
- **Purpose:** Plan comparison + selection.
- **Layout:** Hero + **monthly/annual toggle** + plan cards row + **comparison table** + FAQ + CTA.
- **Primary components:** billing‑period segmented toggle, `PlanCards` (Starter/Operator/Scale/Pro‑Agency/Enterprise), feature comparison matrix, pricing FAQ accordion.
- **Local nav / tabs:** monthly ↔ annual segmented control (interactive).
- **Actions:** Choose plan → `/register`; Contact sales (Enterprise).
- **States:** toggle state (monthly/annual) changes prices; highlighted/recommended plan.
- **PWA notes:** comparison table → horizontal scroll or per‑plan accordion on mobile; sticky billing toggle.
- **Multi-stage / multi-view:** monthly vs annual = two visual states (design both).

---

### Image 5 — `/faq` — FAQ
- **Area / Persona:** Public marketing.
- **Route:** `/faq`
- **Chrome:** Public.
- **Purpose:** Categorised Q&A across the product.
- **Layout:** Hero + category sections, each an accordion list.
- **Primary components (category accordions):** Registration, AI, Portfolios, Work, Compliance, Legal, Money, Accounting, Contacts, Supplier (`Faq*Section`), contact CTA.
- **Local nav / tabs / filters:** category sections (optionally a sticky category jump bar).
- **Actions:** expand/collapse items; Contact us.
- **States:** accordion open/closed.
- **PWA notes:** sticky category chips; search box candidate.

---

### Image 6 — `/contact` — Contact
- **Area / Persona:** Public marketing · `ContactClient` (form).
- **Route:** `/contact`
- **Chrome:** Public.
- **Purpose:** Inbound contact / support / sales.
- **Layout:** 2‑col — contact form (left) + company contact details / mailboxes (right).
- **Primary components:** form (name, email, subject/topic, message), submit; info rail (3 mailboxes, entity address), success state.
- **Actions:** Submit → POST; mailto links.
- **States:** idle / validating / submitting / success / error.
- **PWA notes:** single column; native keyboard types per field; inline validation.
- **Multi-stage / multi-view:** form ↔ success confirmation (two states).

---

### Image 7 — `/help` — Help / Support hub
- **Area / Persona:** Public marketing.
- **Route:** `/help`
- **Chrome:** Public.
- **Purpose:** Help center entry — topics, guides, contact routes.
- **Layout:** Hero with search + topic cards grid + popular articles + contact CTA.
- **Primary components:** help search, category/topic cards, article list, support CTA.
- **Actions:** search; open topic; contact.
- **States:** static (search is candidate for client behaviour).
- **PWA notes:** prominent search; cards stack to single column.

---

### Image 8 — `/changelog` — Changelog
- **Area / Persona:** Public marketing.
- **Route:** `/changelog`
- **Chrome:** Public.
- **Purpose:** Product release notes timeline.
- **Layout:** Hero + reverse‑chronological entries (date, version/tag, bullet changes).
- **Primary components:** timeline list, version tags/badges, category labels (New/Improved/Fixed).
- **Actions:** none / anchor links.
- **States:** static.
- **PWA notes:** vertical timeline; sticky year/month markers.

---

### Image 9 — `/walkthrough` — Product walkthrough
- **Area / Persona:** Public marketing.
- **Route:** `/walkthrough`
- **Chrome:** Public.
- **Purpose:** Guided tour / demo of the product (often video or stepped screens).
- **Layout:** Hero + stepped walkthrough sections (screens/video) + CTA.
- **Primary components:** media blocks, step markers, captions, CTA.
- **Actions:** play media; Get started.
- **States:** static / media play.
- **PWA notes:** full‑width media; vertical step progression on mobile.

---

### Image 10 — `/suppliers` — Supplier landing (recruit suppliers)
- **Area / Persona:** Public marketing · supplier acquisition.
- **Route:** `/suppliers`
- **Chrome:** Public.
- **Purpose:** Recruit trades/suppliers onto the marketplace (distinct from the operator pitch).
- **Layout:** Supplier‑specific hero ("Reach hundreds of local operators") + benefits + how‑it‑works steps + earnings/coverage + testimonials + CTA → register?intent=supplier.
- **Primary components:** hero, benefit cards, steps, stat band, CTA.
- **Actions:** Become a supplier → `/register?intent=supplier`; Log in.
- **States:** static.
- **PWA notes:** supplier CTA sticky; steps as vertical stepper on mobile.

---

**Next:** Batch 02 — Public discovery (`/stays`, `/stays/[slug]`, long‑term + maps, `/services` + `/services/[slug]` + map). Images 11–20.
