import {
  LayoutDashboard, Home, FileText, CreditCard, Wrench, Building2, Wallet, ClipboardList, FolderOpen,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"

export type PortalKind = "supplier" | "landlord" | "tenant"

export interface PortalNavItem {
  label: string
  /** Path segment after /portal/{sessionId}/{kind}; "" = the dashboard root. */
  segment: string
  icon: LucideIcon
}
export interface PortalNavGroup {
  label: string
  items: PortalNavItem[]
}

/**
 * Portal nav — grouped PM-style. Cross-checked against the actual portal pages
 * so every functional page is reachable from the sidebar (no dead-end routes):
 *   tenant   pages: dashboard, tenancy, documents, payments, maintenance
 *   landlord pages: dashboard, properties, financials
 *   supplier pages: dashboard, jobs, invoices, documents
 * Previously the nav was missing tenant→Payments/Documents, landlord→Financials
 * and supplier→Documents; those are restored here for full alignment.
 */
export const PORTAL_NAV: Record<PortalKind, PortalNavGroup[]> = {
  tenant: [
    { label: "OVERVIEW", items: [{ label: "Dashboard", segment: "", icon: LayoutDashboard }] },
    { label: "TENANCY", items: [
      { label: "Tenancy", segment: "tenancy", icon: Home },
      { label: "Documents", segment: "documents", icon: FileText },
    ] },
    { label: "FINANCE", items: [{ label: "Payments", segment: "payments", icon: CreditCard }] },
    { label: "SUPPORT", items: [
      { label: "Maintenance", segment: "maintenance", icon: Wrench },
      { label: "Messages", segment: "messages", icon: MessageSquare },
    ] },
  ],
  landlord: [
    { label: "OVERVIEW", items: [{ label: "Dashboard", segment: "", icon: LayoutDashboard }] },
    { label: "PORTFOLIO", items: [{ label: "Properties", segment: "properties", icon: Building2 }] },
    { label: "FINANCE", items: [{ label: "Financials", segment: "financials", icon: Wallet }] },
    { label: "COMMS", items: [{ label: "Messages", segment: "messages", icon: MessageSquare }] },
  ],
  supplier: [
    { label: "OVERVIEW", items: [{ label: "Dashboard", segment: "", icon: LayoutDashboard }] },
    { label: "WORK", items: [{ label: "Jobs", segment: "jobs", icon: ClipboardList }] },
    { label: "FINANCE", items: [{ label: "Invoices", segment: "invoices", icon: FileText }] },
    { label: "DOCUMENTS", items: [{ label: "Documents", segment: "documents", icon: FolderOpen }] },
    { label: "COMMS", items: [{ label: "Messages", segment: "messages", icon: MessageSquare }] },
  ],
}
