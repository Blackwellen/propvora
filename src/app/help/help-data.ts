// Shared types + honest static content for the Help Centre.
// Used as a fallback when the help_articles table is not present (42P01-safe).
// Articles are full, sectioned guides — not one-line FAQs.

export interface HelpSection {
  heading: string
  body: string
}

export interface HelpArticle {
  id: string
  slug: string
  category: string
  title: string
  summary: string
  /** Full article body, split into headed sections. */
  sections: HelpSection[]
  /**
   * Optional public feature-flag key. When the flag is explicitly disabled for
   * the visitor, the article is hidden (e.g. automations / marketplace / i18n).
   */
  flag?: "marketplace" | "automations" | "i18n"
  /** Estimated read time in minutes (shown on the card). */
  readMins?: number
}

/** Search text for an article (title + summary + every section). */
export function articleText(a: HelpArticle): string {
  return [a.title, a.summary, a.category, ...a.sections.flatMap((s) => [s.heading, s.body])]
    .join(" ")
    .toLowerCase()
}

export const STATIC_HELP_ARTICLES: HelpArticle[] = [
  // ── Getting started ──────────────────────────────────────────────────────
  {
    id: "gs-create-workspace",
    slug: "create-your-workspace",
    category: "Getting started",
    title: "Create your workspace",
    summary: "Sign up, verify your email and run onboarding to create your first workspace.",
    readMins: 3,
    sections: [
      { heading: "Sign up & verify", body: "Register with your email and confirm the verification link we send you. Verifying your email secures your account and unlocks the onboarding wizard." },
      { heading: "Run onboarding", body: "The wizard walks you through naming your workspace, choosing your operation profile, optionally inviting your team, and deciding whether to start blank or with demo data." },
      { heading: "What gets created", body: "When you finish, your workspace, your owner membership and a set of sensible default settings are created automatically. You can change any of these later in Workspace settings." },
    ],
  },
  {
    id: "gs-add-property",
    slug: "add-your-first-property",
    category: "Getting started",
    title: "Add your first property",
    summary: "Add properties and units, then record tenancies against them.",
    readMins: 4,
    sections: [
      { heading: "Add the property", body: "Open Portfolio → Add property, then enter the address and operation profile (e.g. long-term let, HMO, serviced accommodation). The profile tailors which fields and metrics you see." },
      { heading: "Add units", body: "For multi-unit properties (HMOs, blocks), add units such as rooms, flats or studios. Each unit can hold its own tenancy, rent and status." },
      { heading: "Everything links up", body: "Properties flow through to Work (jobs & tasks), Money (income & expenses), Compliance (certificates) and Planning, so your data only needs entering once." },
    ],
  },
  {
    id: "gs-demo-data",
    slug: "using-demo-data",
    category: "Getting started",
    title: "Starting with demo data",
    summary: "Explore Propvora with realistic sample data you can remove any time.",
    readMins: 2,
    sections: [
      { heading: "Load it during onboarding", body: "Choose to load demo data when you set up your workspace. It populates properties, tenancies, jobs and finances so every screen has something to explore." },
      { heading: "It's clearly labelled", body: "Demo records are tagged throughout the app so you never confuse them with real data." },
      { heading: "Remove it any time", body: "Clear demo data from Workspace settings whenever you're ready to add your real portfolio — it's a one-click reset." },
    ],
  },
  {
    id: "gs-mobile-pwa",
    slug: "install-the-app",
    category: "Getting started",
    title: "Install Propvora on your phone",
    summary: "Add Propvora to your home screen as an installable app (PWA).",
    readMins: 2,
    sections: [
      { heading: "Install from your browser", body: "Open Propvora in your mobile browser and choose Add to Home Screen. Propvora installs as a Progressive Web App with its own icon and splash screen." },
      { heading: "Works offline-friendly", body: "The app opens to the login screen and caches your shell so it loads fast, even on a flaky connection." },
    ],
  },

  // ── Portfolio & properties ────────────────────────────────────────────────
  {
    id: "pf-operation-profile",
    slug: "operation-profiles-explained",
    category: "Portfolio & properties",
    title: "Operation profiles explained",
    summary: "Choose how a property is operated so Propvora tailors its metrics.",
    readMins: 3,
    sections: [
      { heading: "What a profile changes", body: "The operation profile (long-term let, HMO, student, serviced accommodation, rent-to-rent, holiday let, commercial and more) tailors which financial metrics, fields and compliance items Propvora shows for that property." },
      { heading: "Change it any time", body: "Edit the property and pick a new profile — dependent fields like property type update automatically. Your existing tenancies, jobs and finances stay intact." },
    ],
  },
  {
    id: "pf-cover-photo",
    slug: "add-property-photos",
    category: "Portfolio & properties",
    title: "Add property photos & cover images",
    summary: "Upload a cover image and gallery photos, cropped to the right ratio.",
    readMins: 2,
    sections: [
      { heading: "Upload & crop", body: "When you upload a cover or gallery image, the built-in cropper lets you pan and zoom to the correct aspect ratio (16:9 for covers) so images never look squashed." },
      { heading: "Where they appear", body: "Cover images show on the property card, detail header and any marketplace listing you create from the property." },
    ],
  },
  {
    id: "pf-units-tenancies",
    slug: "units-and-tenancies",
    category: "Portfolio & properties",
    title: "Units, tenancies and occupancy",
    summary: "Track who lives where, rent, deposits and tenancy dates.",
    readMins: 3,
    sections: [
      { heading: "Record a tenancy", body: "Add a tenancy to a property or unit with the tenant(s), rent amount, deposit, start and end dates and tenancy type. Occupancy and rent roll update automatically." },
      { heading: "Deposits", body: "Record the deposit and its protection scheme. Propvora reminds you of key dates but does not hold tenancy deposits — these are protected in a government-approved scheme." },
    ],
  },

  // ── Compliance ─────────────────────────────────────────────────────────────
  {
    id: "cmp-tracking",
    slug: "tracking-compliance",
    category: "Compliance",
    title: "Tracking certificates & renewals",
    summary: "Keep gas, electrical and other certificates up to date with expiry tracking.",
    readMins: 3,
    sections: [
      { heading: "Add a certificate", body: "Record certificates and inspections (gas safety, EICR, EPC, fire, legionella and more) with their issue and expiry dates and an uploaded copy." },
      { heading: "Stay ahead of deadlines", body: "Propvora highlights what's due soon or overdue with clear states, so you can renew before a deadline passes and stay compliant." },
    ],
  },
  {
    id: "cmp-evidence",
    slug: "uploading-evidence",
    category: "Compliance",
    title: "Uploading compliance evidence",
    summary: "Attach documents and photos as proof against compliance items.",
    readMins: 2,
    sections: [
      { heading: "Attach files", body: "Upload PDFs or photos against any compliance item. Files are stored securely and encrypted at rest." },
      { heading: "Audit-ready", body: "Each upload is timestamped and linked to the property, giving you an audit trail you can show a tenant, lender or local authority." },
    ],
  },
  {
    id: "cmp-jurisdiction",
    slug: "compliance-by-jurisdiction",
    category: "Compliance",
    title: "Compliance by jurisdiction",
    summary: "Compliance items adapt to your legal jurisdiction.",
    readMins: 2,
    flag: "i18n",
    sections: [
      { heading: "Set your jurisdiction", body: "In Workspace settings → Preferences, set your legal jurisdiction. The default is England & Wales." },
      { heading: "Adapted requirements", body: "Compliance categories, terminology and legal disclaimers adapt to the jurisdiction you choose, so the requirements match where your property is." },
    ],
  },

  // ── Money & billing ────────────────────────────────────────────────────────
  {
    id: "mny-invoices",
    slug: "invoices-and-payments",
    category: "Money & billing",
    title: "Invoices, income & expenses",
    summary: "Record income and expenses and raise invoices against properties.",
    readMins: 3,
    sections: [
      { heading: "Record money", body: "Log income and expenses, and raise outbound or supplier invoices. Each record links to the property, tenancy or job it relates to." },
      { heading: "Track status", body: "Invoices move through clear states (draft, sent, paid, overdue) so you always know what's outstanding." },
    ],
  },
  {
    id: "mny-currency",
    slug: "currency-and-locale",
    category: "Money & billing",
    title: "Currency, dates & locale",
    summary: "Money and dates follow your workspace locale.",
    readMins: 2,
    flag: "i18n",
    sections: [
      { heading: "Set your currency", body: "Choose your workspace currency in Preferences (default GBP £). All money values use a central formatter, so amounts display consistently in your currency." },
      { heading: "Date formats", body: "Dates follow your locale (default DD/MM/YYYY for the UK)." },
    ],
  },
  {
    id: "mny-subscription",
    slug: "manage-your-subscription",
    category: "Money & billing",
    title: "Manage your subscription",
    summary: "Upgrade, downgrade and view invoices for your Propvora plan.",
    readMins: 2,
    sections: [
      { heading: "Plans & seats", body: "Your plan sets seat, AI and storage limits. Manage it in Settings → Billing. Higher tiers also pay lower marketplace commission." },
      { heading: "Billing history", body: "View and download your subscription invoices from the billing page at any time." },
    ],
  },
  {
    id: "mny-marketplace-fees",
    slug: "marketplace-fees",
    category: "Money & billing",
    title: "How marketplace fees work",
    summary: "Understand commission and the fees on a marketplace transaction.",
    readMins: 3,
    flag: "marketplace",
    sections: [
      { heading: "Seller commission", body: "Sellers pay a marketplace commission capped at 6.5%, which scales down with your subscription tier (down to 3.5% on enterprise plans)." },
      { heading: "Buyer fees", body: "Buyers pay the price plus a small platform surcharge and the payment-processing fee. Everything is shown clearly before you pay." },
      { heading: "Held in escrow", body: "Funds are held securely until the booking or job is completed, then released to the seller — protecting both sides." },
    ],
  },

  // ── Marketplace & bookings ─────────────────────────────────────────────────
  {
    id: "mkt-list-stay",
    slug: "list-a-stay",
    category: "Marketplace & bookings",
    title: "List a stay on the marketplace",
    summary: "Publish a property as a bookable stay with photos, pricing and rules.",
    readMins: 4,
    flag: "marketplace",
    sections: [
      { heading: "Create the listing", body: "From a property, create a stay listing with photos, nightly price, fees, house rules and availability. The listing wizard guides each step." },
      { heading: "Instant book or request", body: "Choose whether guests can book instantly or whether you approve each request first." },
      { heading: "Go live", body: "Publish to make the listing discoverable in the public marketplace and on your own booking page." },
    ],
  },
  {
    id: "mkt-booking-flow",
    slug: "how-guests-book",
    category: "Marketplace & bookings",
    title: "How guests book and pay",
    summary: "The booking, payment and escrow flow for stays.",
    readMins: 3,
    flag: "marketplace",
    sections: [
      { heading: "Availability & dates", body: "Guests pick dates; Propvora checks the listing is still available before holding the booking." },
      { heading: "Secure payment", body: "Guests pay by card, Google Pay or Apple Pay. Funds are authorised and held in escrow." },
      { heading: "Confirmation", body: "The booking is only confirmed once payment succeeds. Both sides receive a confirmation with the reference number." },
    ],
  },
  {
    id: "mkt-deposits",
    slug: "damage-deposits-and-holds",
    category: "Marketplace & bookings",
    title: "Damage deposits & holds",
    summary: "How refundable damage deposits work on stays.",
    readMins: 2,
    flag: "marketplace",
    sections: [
      { heading: "Authorisation hold", body: "A damage deposit is taken as a card authorisation hold — no money moves unless a claim is made. It's released automatically after check-out." },
      { heading: "Long lets are different", body: "For long-term tenancies, Propvora does not take a tenancy deposit; these must be protected in a government-approved scheme." },
    ],
  },
  {
    id: "mkt-cancellations",
    slug: "cancellations-and-refunds",
    category: "Marketplace & bookings",
    title: "Cancellations & refunds",
    summary: "What happens when a booking is cancelled.",
    readMins: 2,
    flag: "marketplace",
    sections: [
      { heading: "Cancellation policy", body: "Each listing has a cancellation policy shown before booking. Free-cancellation windows refund the guest automatically." },
      { heading: "Refund routing", body: "Refunds return to the original payment method. Where funds are still held in escrow, no capture takes place." },
    ],
  },

  // ── Suppliers & services ───────────────────────────────────────────────────
  {
    id: "sup-onboard",
    slug: "become-a-supplier",
    category: "Suppliers & services",
    title: "Become a verified supplier",
    summary: "Get verified to offer services on the Propvora marketplace.",
    readMins: 3,
    flag: "marketplace",
    sections: [
      { heading: "Verification first", body: "Before you can sell, you must verify your identity, provide the required insurance, and complete verification. This protects buyers and builds trust." },
      { heading: "Connect payouts", body: "Connect a Stripe account so payouts can reach you. Propvora is a facilitator — funds settle to your connected account, minus commission." },
    ],
  },
  {
    id: "sup-quotes-jobs",
    slug: "quotes-and-jobs",
    category: "Suppliers & services",
    title: "Quotes, jobs and getting paid",
    summary: "Respond to requests, agree work and receive escrowed payment.",
    readMins: 3,
    flag: "marketplace",
    sections: [
      { heading: "Respond to requests", body: "Receive job requests, send quotes and agree the work. Emergency call-outs surface fastest." },
      { heading: "Escrow & release", body: "Payment is held in escrow when the job is booked and released to you on completion, so both sides are protected." },
    ],
  },
  {
    id: "sup-emergency",
    slug: "emergency-callouts",
    category: "Suppliers & services",
    title: "Emergency call-outs",
    summary: "How urgent jobs are dispatched and priced.",
    readMins: 2,
    flag: "marketplace",
    sections: [
      { heading: "Fast dispatch", body: "Emergency requests dispatch the nearest available, vetted pro with a clear response-time estimate." },
      { heading: "Upfront pricing", body: "The call-out is quoted before work starts; further work is agreed on site. For life-threatening emergencies, always call 999 first." },
    ],
  },

  // ── Automations ────────────────────────────────────────────────────────────
  {
    id: "auto-overview",
    slug: "automations-overview",
    category: "Automations",
    title: "Automations overview",
    summary: "Trigger actions automatically based on events in your workspace.",
    readMins: 3,
    flag: "automations",
    sections: [
      { heading: "Triggers & actions", body: "Automations run an action (such as sending a message, creating a task or raising an invoice) when a trigger fires — for example a tenancy ending or a certificate nearing expiry." },
      { heading: "Build a workflow", body: "Use the canvas to chain steps into a workflow. Test each node individually, then run the whole flow." },
    ],
  },
  {
    id: "auto-webhooks",
    slug: "webhooks-and-integrations",
    category: "Automations",
    title: "Webhooks & integrations",
    summary: "Connect Propvora to external tools with inbound and outbound webhooks.",
    readMins: 3,
    flag: "automations",
    sections: [
      { heading: "Outbound webhooks", body: "Send workspace events to an external URL so other systems can react to what happens in Propvora." },
      { heading: "Inbound webhooks", body: "Receive events from external tools to trigger automations inside Propvora." },
    ],
  },
  {
    id: "auto-testing",
    slug: "testing-automations",
    category: "Automations",
    title: "Testing your automations safely",
    summary: "Validate nodes and flows before they run on real data.",
    readMins: 2,
    flag: "automations",
    sections: [
      { heading: "Test a node", body: "Run any individual node with sample input to confirm it behaves as expected before wiring it into a flow." },
      { heading: "Dry-run the flow", body: "Run the whole workflow end-to-end in a safe mode to confirm the sequence before enabling it live." },
    ],
  },

  // ── Internationalisation ───────────────────────────────────────────────────
  {
    id: "i18n-preferences",
    slug: "language-currency-legal",
    category: "Internationalisation",
    title: "Locale, currency & legal context",
    summary: "Configure language, currency, date format and jurisdiction.",
    readMins: 2,
    flag: "i18n",
    sections: [
      { heading: "One place to set it", body: "Workspace settings → Preferences holds your locale, currency, date format and legal jurisdiction — visible and editable, never hidden." },
      { heading: "Applied everywhere", body: "Money formatting, dates and legal disclaimers across the app respect these settings." },
    ],
  },
  {
    id: "i18n-legal",
    slug: "legal-context-by-country",
    category: "Internationalisation",
    title: "Legal context by country",
    summary: "Disclaimers and terminology adapt to your jurisdiction.",
    readMins: 2,
    flag: "i18n",
    sections: [
      { heading: "Jurisdiction-aware", body: "Legal disclaimers adapt to your jurisdiction (default England & Wales), and compliance terminology matches local conventions." },
    ],
  },

  // ── AI Copilot ─────────────────────────────────────────────────────────────
  {
    id: "ai-copilot",
    slug: "using-ai-copilot",
    category: "AI Copilot",
    title: "Using the AI Copilot",
    summary: "Ask questions and draft content with a human always in control.",
    readMins: 3,
    sections: [
      { heading: "What it does", body: "The Copilot answers questions about your portfolio, summarises records and drafts messages and listings." },
      { heading: "You stay in control", body: "It proposes actions for you to review and approve — it never makes changes without your confirmation." },
    ],
  },
  {
    id: "ai-limits",
    slug: "ai-limits-and-safety",
    category: "AI Copilot",
    title: "AI limits, caps & safety",
    summary: "Understand AI usage caps and accuracy limitations.",
    readMins: 2,
    sections: [
      { heading: "Usage caps", body: "AI usage is metered by your plan. When you reach your cap, you'll be prompted to upgrade." },
      { heading: "Accuracy", body: "AI can make mistakes. Always review AI output before acting on it, especially for legal, financial or compliance matters." },
    ],
  },

  // ── Account & security ─────────────────────────────────────────────────────
  {
    id: "acc-password",
    slug: "reset-your-password",
    category: "Account & security",
    title: "Reset your password",
    summary: "Use the forgot-password flow to securely reset your password.",
    readMins: 2,
    sections: [
      { heading: "Request a reset", body: "On the login screen choose Forgot password and enter your email. You'll receive a secure reset link." },
      { heading: "Set a new password", body: "Open the link, set a new password and you'll be signed in. If the email doesn't arrive, check your spam folder." },
    ],
  },
  {
    id: "acc-2fa",
    slug: "two-factor-authentication",
    category: "Account & security",
    title: "Two-factor authentication",
    summary: "Add a second factor to protect your account.",
    readMins: 2,
    sections: [
      { heading: "Enable 2FA", body: "In Account → Security, enable two-factor authentication and scan the code with your authenticator app." },
      { heading: "Why it matters", body: "2FA stops attackers signing in with a stolen password alone. Repeated failed sign-ins are also rate-limited to block brute-force attempts." },
    ],
  },
  {
    id: "acc-data-security",
    slug: "how-we-protect-your-data",
    category: "Account & security",
    title: "How we protect your data",
    summary: "Encryption in transit and at rest, and how payments are handled.",
    readMins: 3,
    sections: [
      { heading: "Encryption", body: "Your data is encrypted in transit with TLS and at rest with AES-256 by our infrastructure provider, including backups." },
      { heading: "Payments", body: "Card details never touch our servers — they're tokenised by Stripe. We only store a payment reference." },
    ],
  },
  {
    id: "acc-personas",
    slug: "switch-between-workspaces",
    category: "Account & security",
    title: "Switch between workspaces",
    summary: "Use one login across customer, property-manager and supplier workspaces.",
    readMins: 2,
    sections: [
      { heading: "One account", body: "A single Propvora account can belong to multiple workspaces. Switch between them from the account switcher." },
      { heading: "Smart default", body: "We send you to your most relevant workspace on login; you can switch any time." },
    ],
  },

  // ── Bookings (guest/customer) ──────────────────────────────────────────────
  {
    id: "cust-find-stay",
    slug: "find-and-save-stays",
    category: "Booking as a customer",
    title: "Find and save stays",
    summary: "Search, filter and save places you love.",
    readMins: 2,
    flag: "marketplace",
    sections: [
      { heading: "Search & filter", body: "Use the search bar and filters (price, type, bedrooms, pets, instant book and more) to narrow results to what suits you." },
      { heading: "Save favourites", body: "Tap the heart on any stay to save it. Saving requires a free account so your favourites follow you across devices." },
    ],
  },
  {
    id: "cust-manage-booking",
    slug: "manage-your-bookings",
    category: "Booking as a customer",
    title: "Manage your bookings",
    summary: "View, message and manage trips from your customer workspace.",
    readMins: 2,
    flag: "marketplace",
    sections: [
      { heading: "Your trips", body: "All your upcoming and past stays live in My bookings, with dates, guests, totals and status." },
      { heading: "Message the host", body: "Message your host directly from the booking for arrival details or special requests." },
    ],
  },
  {
    id: "cust-long-lets",
    slug: "applying-for-a-long-let",
    category: "Booking as a customer",
    title: "Applying for a long-term let",
    summary: "Request viewings and apply for long-term rentals.",
    readMins: 3,
    flag: "marketplace",
    sections: [
      { heading: "Request a viewing", body: "On a long-let listing, request a viewing with your preferred dates. The landlord or agent confirms a slot." },
      { heading: "Apply", body: "Submit an application with the required details. You'll be guided through each step, and can track its status in your workspace." },
    ],
  },
]

export const HELP_CATEGORIES = [
  "Getting started",
  "Portfolio & properties",
  "Compliance",
  "Money & billing",
  "Marketplace & bookings",
  "Suppliers & services",
  "Automations",
  "Internationalisation",
  "AI Copilot",
  "Account & security",
  "Booking as a customer",
]
