"use client"

import { FileText, LayoutDashboard, Settings, ShieldCheck, Wrench } from "lucide-react"
import AuthenticatedPortalShell from "./AuthenticatedPortalShell"

const base = "/supplier-portal"
const navConfig = {
  base,
  groups: [
    { label: "OVERVIEW", items: [{ label: "Dashboard", href: base, icon: LayoutDashboard }] },
    { label: "WORK", items: [
      { label: "Jobs", href: `${base}/jobs`, icon: Wrench },
      { label: "Invoices", href: `${base}/invoices`, icon: FileText },
      { label: "Verification", href: `${base}/verification`, icon: ShieldCheck },
    ] },
    { label: "SYSTEM", items: [{ label: "Settings", href: `${base}/settings`, icon: Settings }] },
  ],
  workspaceHref: `${base}/settings`,
  accountHref: `${base}/settings`,
}

export default function SupplierShell({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortalShell title="Supplier portal" navConfig={navConfig}>{children}</AuthenticatedPortalShell>
}
