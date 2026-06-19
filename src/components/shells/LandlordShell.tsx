"use client"

import { Building2, FolderOpen, LayoutDashboard, MessageSquare, Receipt, Settings, Wrench } from "lucide-react"
import AuthenticatedPortalShell from "./AuthenticatedPortalShell"

const base = "/landlord-portal"
const navConfig = {
  base,
  groups: [
    { label: "OVERVIEW", items: [{ label: "Home", href: base, icon: LayoutDashboard }] },
    { label: "PORTFOLIO", items: [
      { label: "Properties", href: `${base}/properties`, icon: Building2 },
      { label: "Statements", href: `${base}/statements`, icon: Receipt },
      { label: "Work updates", href: `${base}/work`, icon: Wrench },
      { label: "Documents", href: `${base}/documents`, icon: FolderOpen },
      { label: "Messages", href: `${base}/messages`, icon: MessageSquare },
    ] },
    { label: "SYSTEM", items: [{ label: "Settings", href: `${base}/settings`, icon: Settings }] },
  ],
  workspaceHref: `${base}/settings`,
  accountHref: `${base}/settings`,
}

export default function LandlordShell({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortalShell title="Landlord portal" navConfig={navConfig}>{children}</AuthenticatedPortalShell>
}
