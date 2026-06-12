import { Settings } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "How do I change my workspace name or branding?",
    a: "Go to Settings → Workspace → General. Here you can update your workspace name (shown in the navigation and on any tenant or client-facing outputs), upload a workspace logo (displayed on invoices, receipts, and portal pages), set your timezone, and configure your default currency. Logo uploads should be a minimum of 200×200px in PNG or SVG format for best quality. Changes take effect immediately across the whole workspace.",
  },
  {
    q: "How do I manage team member roles and permissions?",
    a: "Settings → Team lists all current members. From here you can: change a member's role using the dropdown (Administrator, Manager, or View Only), temporarily deactivate a member's access without removing them (useful for staff on leave), permanently remove a member, and resend a pending invitation. Role permissions are fixed — Administrator has full access including billing, Manager can create and edit all records but cannot access billing or delete the workspace, View Only has read-only access to everything. Custom roles are on the roadmap.",
  },
  {
    q: "Where do I manage my subscription and billing?",
    a: "Settings → Billing. This page shows: your current plan and price, the next billing date and amount, your payment method (card details managed securely via Stripe — Propvora never stores raw card numbers), your full invoice history with downloadable PDFs, your AI query usage and any add-ons, and options to upgrade, downgrade, or cancel. Downgrading or cancelling takes effect at the end of your current billing period, not immediately.",
  },
  {
    q: "How do I configure email notifications?",
    a: "Settings → Notifications. You can toggle email notifications for each event type: compliance certificate expiry alerts (at each threshold), new job assignments, job status changes, rent payment received, rent arrears triggered, tenancy expiry warnings, new team member invitations, and system announcements. Each team member configures their own notification preferences — Administrators don't control which notifications other members receive.",
  },
  {
    q: "How do I change the default currency across my workspace?",
    a: "Settings → Workspace → General → Currency. Select your preferred currency from the dropdown (GBP, EUR, USD, AED, and other major currencies are supported). This changes the currency symbol and formatting displayed across all money values in your workspace — it does not convert existing values. All amounts you've entered are stored as plain numbers — so changing from GBP to EUR, for example, will not recalculate the values.",
  },
  {
    q: "Can I delete my workspace?",
    a: "Yes, but it is permanent and irreversible. Settings → Workspace → Danger Zone → Delete Workspace. Before deleting, Propvora requires you to: export your data (a full data export is triggered before deletion is allowed), type your workspace name to confirm, and enter your account password. After deletion is confirmed, your workspace enters a 30-day grace period during which you can contact support to restore it. After 30 days, all data is permanently and irreversibly deleted from our systems with no possibility of recovery.",
  },
  {
    q: "Can I set up two-factor authentication?",
    a: "Yes. Settings → Account → Security → Two-Factor Authentication. Propvora supports TOTP-based 2FA using any authenticator app (Google Authenticator, Authy, 1Password, etc.). Once enabled, you'll be required to enter a 6-digit code from your authenticator app on each new login. Workspace Administrators can require all team members to enable 2FA from Settings → Team → Security Policy.",
  },
]

export default function FaqSettingsSection() {
  return (
    <FaqGroup
      id="settings"
      title="Settings"
      icon={<Settings className="w-5 h-5 text-white" />}
      colour="bg-slate-600"
      items={items}
    />
  )
}
