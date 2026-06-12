import { Plug } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "Does Propvora integrate with Xero or QuickBooks?",
    a: "Direct integrations with Xero and QuickBooks are on the 2025 product roadmap. When available, they will support two-way sync of income, expenses, and invoices between Propvora and your accounting package. Currently, you can export financial data as a CSV from Accounting → Reports and import it into your accounting software manually. The exported data is structured to align with standard chart of accounts formats used by both Xero and QuickBooks.",
  },
  {
    q: "Is there a Propvora API?",
    a: "A REST API is available as an add-on on the Business plan. It provides authenticated read and write access to your portfolio, contacts, jobs, compliance records, and financial data. The API uses OAuth 2.0 for authentication and follows RESTful conventions with JSON responses. Rate limits apply (1,000 requests/hour on standard API access). Full API documentation, interactive explorer, and client SDKs (TypeScript, Python) are available at api.propvora.com. Webhook support for real-time event delivery is also included.",
  },
  {
    q: "Can I sync Propvora with my calendar (Google Calendar, Outlook, Apple Calendar)?",
    a: "iCal export is supported on all plans. You can subscribe to your Propvora calendar (compliance due dates, tenancy renewals, job due dates, reminders) from any calendar application that supports iCal/ICS subscriptions — including Google Calendar, Microsoft Outlook, and Apple Calendar. The iCal URL is available in Settings → Integrations → Calendar Sync. Two-way sync (allowing calendar changes to update Propvora) is on the roadmap.",
  },
  {
    q: "Are there Zapier or Make (Integromat) integrations?",
    a: "Zapier integration is in development, planned for H2 2025. When live, it will offer Propvora triggers (new property added, tenancy expiring, job completed, compliance alert triggered) and actions (create contact, create job, add note) — enabling no-code automation with the hundreds of apps in the Zapier ecosystem. Make (formerly Integromat) integration will follow. Until these are available, the Business plan API can be used for custom automation workflows.",
  },
  {
    q: "Does Propvora have a mobile app?",
    a: "Propvora is a web application built to be responsive and works in mobile browsers on iOS and Android. There is no native app currently in the App Store or Google Play. A native mobile app with offline capability and push notifications is in development and is one of our most-requested features. If you'd like to be notified when the mobile app launches, you can join the waitlist from your account settings.",
  },
  {
    q: "Can suppliers access the Supplier Portal without downloading an app?",
    a: "Yes. The Supplier Portal is a web-based interface accessible from any modern browser on desktop, tablet, or mobile — no app download or Propvora subscription required for contractors. Suppliers receive an email invitation with a link to set up their portal password, and can then access their jobs from any device. This keeps the barrier to adoption low for contractors who may not be comfortable with dedicated software.",
  },
  {
    q: "Can Propvora connect to property portals like Rightmove or Zoopla?",
    a: "Property portal integrations are on the long-term roadmap. A direct feed integration with Rightmove and Zoopla would allow available units to be listed directly from Propvora without re-entering data on the portals. This is a significant integration requiring partnership with the portals and is not planned for the current roadmap cycle. In the meantime, you can manage listings manually on the portals and record enquiries and applications within Propvora.",
  },
]

export default function FaqConnectorsSection() {
  return (
    <FaqGroup
      id="connectors"
      title="Connectors & Integrations"
      icon={<Plug className="w-5 h-5 text-white" />}
      colour="bg-teal-600"
      items={items}
    />
  )
}
