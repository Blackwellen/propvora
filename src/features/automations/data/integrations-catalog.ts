// Product catalog of available integrations for Propvora.
// This is STATIC REFERENCE DATA (like a product brochure), not fake user data.
// All connection credentials come from environment variables or user-supplied API keys.

export type IntegrationCategory =
  | "accounting"
  | "payments"
  | "communications"
  | "calendar"
  | "property_portals"
  | "crm"
  | "storage"

export type ConnectType = "oauth" | "api_key" | "coming_soon"

export interface CatalogIntegration {
  id: string
  name: string
  category: IntegrationCategory
  description: string
  /** Tailwind gradient classes for the icon background */
  logoGradient: string
  /** Short letter abbreviation shown inside the gradient tile */
  logoInitials: string
  features: string[]
  connectType: ConnectType
  /** API route that initiates the OAuth flow */
  oauthPath?: string
  docsUrl?: string
  popular?: boolean
}

export const AVAILABLE_INTEGRATIONS: CatalogIntegration[] = [
  // ── Accounting ──────────────────────────────────────────────────────────────
  {
    id: "xero",
    name: "Xero",
    category: "accounting",
    description: "Sync rent income, expenses, and invoices directly into Xero for seamless accounting.",
    logoGradient: "from-blue-500 to-blue-700",
    logoInitials: "Xe",
    features: [
      "Auto-create invoices when rent is received",
      "Sync supplier payments to expense categories",
      "Reconcile bank transactions",
      "VAT reporting for rental income",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/xero/auth",
    docsUrl: "https://developer.xero.com",
    popular: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    description: "Connect QuickBooks Online to automatically record property income and maintenance costs.",
    logoGradient: "from-green-500 to-green-700",
    logoInitials: "QB",
    features: [
      "Two-way transaction sync",
      "Property-level profit and loss reports",
      "Automatic expense categorisation",
      "Chart of accounts mapping",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/quickbooks/auth",
    docsUrl: "https://developer.intuit.com",
  },
  {
    id: "sage",
    name: "Sage",
    category: "accounting",
    description: "Push rental income and supplier invoices into Sage 50 or Sage Business Cloud.",
    logoGradient: "from-emerald-500 to-teal-700",
    logoInitials: "Sa",
    features: [
      "Invoice export to Sage",
      "Property-tagged nominal codes",
      "Supplier payment records",
      "Period-end reporting export",
    ],
    connectType: "api_key",
    docsUrl: "https://developer.sage.com",
  },
  {
    id: "freeagent",
    name: "FreeAgent",
    category: "accounting",
    description: "Ideal for smaller portfolios — sync rent and maintenance costs with FreeAgent.",
    logoGradient: "from-orange-400 to-orange-600",
    logoInitials: "FA",
    features: [
      "Bank transaction sync",
      "Property income tagging",
      "Self-assessment friendly exports",
      "HMRC MTD-ready reporting",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/freeagent/auth",
    docsUrl: "https://dev.freeagent.com",
  },

  // ── Payments ────────────────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    description: "Accept card payments for rent, deposits, and fees with Stripe's secure checkout.",
    logoGradient: "from-violet-500 to-violet-700",
    logoInitials: "St",
    features: [
      "Secure card payment collection",
      "Automated rent payment links",
      "Deposit holding with Stripe Escrow",
      "Webhook events for payment confirmations",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/stripe/auth",
    docsUrl: "https://stripe.com/docs",
    popular: true,
  },
  {
    id: "gocardless",
    name: "GoCardless",
    category: "payments",
    description: "Set up recurring Direct Debit mandates for rent collection — ideal for UK landlords.",
    logoGradient: "from-sky-500 to-sky-700",
    logoInitials: "GC",
    features: [
      "Recurring Direct Debit mandates",
      "BACS payment collection",
      "Automated failure and retry handling",
      "Real-time payment webhooks",
    ],
    connectType: "api_key",
    docsUrl: "https://developer.gocardless.com",
    popular: true,
  },
  {
    id: "paypoint",
    name: "PayPoint",
    category: "payments",
    description: "Accept cash rent payments at thousands of PayPoint retail locations across the UK.",
    logoGradient: "from-red-500 to-red-700",
    logoInitials: "PP",
    features: [
      "Cash payment acceptance at PayPoint stores",
      "Payment confirmation webhooks",
      "Barcode-based tenant payment slips",
      "Reconciliation reports",
    ],
    connectType: "api_key",
    docsUrl: "https://www.paypoint.com/business/integrations",
  },

  // ── Property Portals ────────────────────────────────────────────────────────
  {
    id: "rightmove",
    name: "Rightmove",
    category: "property_portals",
    description: "Publish and update listings on Rightmove directly from your portfolio.",
    logoGradient: "from-red-600 to-red-800",
    logoInitials: "Rm",
    features: [
      "One-click listing publication",
      "Automatic availability updates",
      "Lead enquiry sync to contacts",
      "Photo and floorplan upload",
    ],
    connectType: "api_key",
    docsUrl: "https://www.rightmove.co.uk/developer",
    popular: true,
  },
  {
    id: "zoopla",
    name: "Zoopla",
    category: "property_portals",
    description: "Sync your lettings listings to Zoopla and receive enquiries in Propvora.",
    logoGradient: "from-purple-500 to-purple-700",
    logoInitials: "Zo",
    features: [
      "Lettings listing publication",
      "Price change propagation",
      "Enquiry capture to contacts",
      "Listing performance reporting",
    ],
    connectType: "api_key",
    docsUrl: "https://developer.zoopla.co.uk",
  },
  {
    id: "onthemarket",
    name: "OnTheMarket",
    category: "property_portals",
    description: "Publish to OnTheMarket and benefit from its agent-only new-instruction window.",
    logoGradient: "from-indigo-500 to-indigo-700",
    logoInitials: "OT",
    features: [
      "Early listing exclusivity window",
      "Listing creation and update sync",
      "Lead routing to CRM contacts",
      "Photo management",
    ],
    connectType: "api_key",
    docsUrl: "https://www.onthemarket.com/about/agents",
  },
  {
    id: "spareroom",
    name: "SpareRoom",
    category: "property_portals",
    description: "Advertise HMO rooms and find tenants via the UK's largest room-let marketplace.",
    logoGradient: "from-amber-500 to-orange-600",
    logoInitials: "SR",
    features: [
      "Room advertisement and photo upload",
      "Tenant enquiry routing",
      "HMO-specific room management",
      "Availability calendar sync",
    ],
    connectType: "api_key",
    docsUrl: "https://www.spareroom.co.uk/help/advertising",
  },

  // ── Calendar ────────────────────────────────────────────────────────────────
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "calendar",
    description: "Sync property inspections, maintenance visits, and lease events with Google Calendar.",
    logoGradient: "from-blue-400 to-green-500",
    logoInitials: "GC",
    features: [
      "Two-way event sync",
      "Maintenance visit scheduling",
      "Tenancy event reminders",
      "Team calendar sharing",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/google-calendar/auth",
    docsUrl: "https://developers.google.com/calendar",
    popular: true,
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    category: "calendar",
    description: "Connect your Outlook or Microsoft 365 calendar for property and tenant event sync.",
    logoGradient: "from-blue-600 to-blue-900",
    logoInitials: "M3",
    features: [
      "Microsoft 365 calendar sync",
      "Outlook event creation from inspections",
      "Teams meeting link generation",
      "Shared mailbox support",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/outlook/auth",
    docsUrl: "https://docs.microsoft.com/graph",
  },
  {
    id: "apple_calendar",
    name: "Apple Calendar",
    category: "calendar",
    description: "Subscribe to your property calendar via iCal — works with Apple Calendar, Outlook, and more.",
    logoGradient: "from-slate-400 to-slate-600",
    logoInitials: "iC",
    features: [
      "iCal feed subscription (read-only)",
      "Auto-updating calendar URL",
      "Works with any iCal-compatible app",
      "No sign-in required on client side",
    ],
    connectType: "api_key",
    docsUrl: "https://icalendar.org",
  },

  // ── Communications ──────────────────────────────────────────────────────────
  {
    id: "resend",
    name: "Resend",
    category: "communications",
    description: "Transactional email delivery for tenant notices, rent receipts, and compliance letters.",
    logoGradient: "from-slate-700 to-slate-900",
    logoInitials: "Re",
    features: [
      "Branded HTML email templates",
      "Delivery tracking and open rates",
      "Bounce and complaint handling",
      "Audit trail for legal compliance",
    ],
    connectType: "api_key",
    docsUrl: "https://resend.com/docs",
    popular: true,
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "communications",
    description: "Send SMS reminders for rent due dates, maintenance updates, and certificate expirations.",
    logoGradient: "from-red-500 to-red-700",
    logoInitials: "Tw",
    features: [
      "SMS notification delivery",
      "Two-way SMS for tenant responses",
      "Automated reminder sequences",
      "Delivery status webhooks",
    ],
    connectType: "api_key",
    docsUrl: "https://www.twilio.com/docs",
  },
  {
    id: "whatsapp_business",
    name: "WhatsApp Business",
    category: "communications",
    description: "Message tenants and landlords via WhatsApp Business API for high-open-rate communications.",
    logoGradient: "from-green-500 to-green-700",
    logoInitials: "WA",
    features: [
      "Template message delivery (pre-approved)",
      "Rent reminder WhatsApp messages",
      "Maintenance update notifications",
      "Read receipt and delivery tracking",
    ],
    connectType: "api_key",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
  },

  // ── Storage ──────────────────────────────────────────────────────────────────
  {
    id: "google_drive",
    name: "Google Drive",
    category: "storage",
    description: "Sync tenancy agreements, compliance certificates, and inspection reports to Google Drive.",
    logoGradient: "from-yellow-400 to-green-500",
    logoInitials: "GD",
    features: [
      "Auto-upload signed documents",
      "Folder-per-property organisation",
      "Shared drive support",
      "Version history for compliance",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/google-drive/auth",
    docsUrl: "https://developers.google.com/drive",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "storage",
    description: "Push property documents and certificates to a Dropbox folder for secure cloud storage.",
    logoGradient: "from-blue-500 to-blue-700",
    logoInitials: "Db",
    features: [
      "Document auto-backup",
      "Shared folder per property",
      "File version history",
      "Team access controls",
    ],
    connectType: "api_key",
    docsUrl: "https://www.dropbox.com/developers",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    category: "storage",
    description: "Store tenancy documents and compliance files in OneDrive or SharePoint.",
    logoGradient: "from-sky-400 to-blue-600",
    logoInitials: "OD",
    features: [
      "SharePoint library integration",
      "Auto-upload for signed documents",
      "Microsoft 365 permissions model",
      "Audit trail for regulated files",
    ],
    connectType: "oauth",
    oauthPath: "/api/integrations/onedrive/auth",
    docsUrl: "https://docs.microsoft.com/onedrive",
  },

  // ── CRM ─────────────────────────────────────────────────────────────────────
  {
    id: "salesforce",
    name: "Salesforce",
    category: "crm",
    description: "Enterprise CRM integration for large property management organisations.",
    logoGradient: "from-sky-500 to-blue-700",
    logoInitials: "SF",
    features: [
      "Contact and account sync",
      "Opportunity pipeline from leads",
      "Custom object mapping",
      "Enterprise reporting dashboards",
    ],
    connectType: "coming_soon",
    docsUrl: "https://developer.salesforce.com",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "Sync landlord and applicant contacts to HubSpot for pipeline and relationship management.",
    logoGradient: "from-orange-500 to-red-600",
    logoInitials: "HS",
    features: [
      "Landlord contact sync",
      "Lead pipeline management",
      "Email sequence automation",
      "Deal stage tracking",
    ],
    connectType: "coming_soon",
    docsUrl: "https://developers.hubspot.com",
  },
]

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  accounting: "Accounting",
  payments: "Payments",
  communications: "Communications",
  calendar: "Calendar",
  property_portals: "Property portals",
  crm: "CRM",
  storage: "Storage",
}

export const CATEGORY_ORDER: IntegrationCategory[] = [
  "accounting",
  "payments",
  "property_portals",
  "calendar",
  "communications",
  "storage",
  "crm",
]
