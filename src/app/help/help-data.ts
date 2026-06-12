// Shared types + honest static getting-started content for the Help Centre.
// Used as a fallback when the help_articles table is not present (42P01-safe).

export interface HelpArticle {
  id: string
  slug: string
  category: string
  title: string
  summary: string
  body: string
}

export const STATIC_HELP_ARTICLES: HelpArticle[] = [
  {
    id: "getting-started-create-workspace",
    slug: "create-your-workspace",
    category: "Getting started",
    title: "Create your workspace",
    summary:
      "Sign up, verify your email and run the onboarding wizard to create your first workspace.",
    body: "After registering, confirm your email address. The onboarding wizard then walks you through naming your workspace, choosing your operation profile, optionally inviting your team, and deciding whether to start blank or with demo data. When you finish, your workspace, owner membership and default settings are created automatically.",
  },
  {
    id: "getting-started-add-property",
    slug: "add-your-first-property",
    category: "Getting started",
    title: "Add your first property",
    summary: "Add properties and units, then record tenancies against them.",
    body: "Open Portfolio, choose Add property, and enter the address and operation profile. You can add units to a property (rooms, flats, studios) and then record tenancies with rent, deposit and dates. Everything you add links through to work, money and compliance.",
  },
  {
    id: "getting-started-demo-data",
    slug: "using-demo-data",
    category: "Getting started",
    title: "Starting with demo data",
    summary: "Explore Propvora with realistic sample data you can remove any time.",
    body: "During onboarding you can choose to load demo data. It is clearly labelled throughout the app and can be removed from your workspace settings whenever you like, so you can explore features risk-free before adding your real portfolio.",
  },
  {
    id: "team-invite",
    slug: "invite-your-team",
    category: "Team & access",
    title: "Invite your team",
    summary: "Invite colleagues to your workspace and assign roles.",
    body: "From onboarding or workspace settings you can invite team members by email and assign a role (admin, member, viewer, finance). Invitees receive a link to accept the invitation, which adds them to your workspace with the role you chose.",
  },
  {
    id: "compliance-tracking",
    slug: "tracking-compliance",
    category: "Compliance",
    title: "Tracking certificates and renewals",
    summary: "Keep gas, electrical and other certificates up to date with expiry tracking.",
    body: "The Compliance section tracks certificates, inspections and renewals with clear expiry states. Propvora highlights what is due or overdue so you can act before a deadline passes.",
  },
  {
    id: "money-invoices",
    slug: "invoices-and-payments",
    category: "Money",
    title: "Invoices and payments",
    summary: "Record income and expenses and raise invoices against properties.",
    body: "In the Money section you can record income and expenses, raise outbound and supplier invoices, and track their status. Records link to the properties, tenancies and jobs they relate to for a complete financial picture.",
  },
  {
    id: "planning-engine",
    slug: "modelling-a-deal",
    category: "Planning",
    title: "Modelling a deal",
    summary: "Use the planning engine to model deal economics before you commit.",
    body: "The planning engine lets you build a financial model for any operation profile — entering income, costs and assumptions to calculate gross and net yield, ROI, breakeven and a risk score. You can compare scenarios side by side and generate a landlord offer.",
  },
  {
    id: "ai-copilot",
    slug: "using-ai-copilot",
    category: "AI Copilot",
    title: "Using the AI Copilot",
    summary: "Ask questions and draft content with a human always in control.",
    body: "The AI Copilot can answer questions about your portfolio, summarise records and draft messages. It proposes actions for you to review and approve — it never makes changes without your confirmation.",
  },
  {
    id: "account-password",
    slug: "reset-your-password",
    category: "Account",
    title: "Reset your password",
    summary: "Use the forgot-password flow to securely reset your password.",
    body: "On the login screen choose Forgot password and enter your email. You'll receive a secure reset link. Open it, set a new password, and you'll be signed in. If you don't receive the email, check your spam folder.",
  },
]

export const HELP_CATEGORIES = [
  "Getting started",
  "Team & access",
  "Compliance",
  "Money",
  "Planning",
  "AI Copilot",
  "Account",
]
