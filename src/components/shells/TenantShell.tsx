"use client"

import { CalendarCheck, FolderOpen, Home, LayoutDashboard, MessageSquare, PoundSterling, Settings, Wrench } from "lucide-react"
import AuthenticatedPortalShell from "./AuthenticatedPortalShell"

const base = "/tenant-portal"
const navConfig = {
  base,
  groups: [
    { label: "OVERVIEW", items: [{ label: "Home", href: base, icon: LayoutDashboard }] },
    { label: "TENANCY", items: [
      { label: "Tenancy", href: `${base}/tenancy`, icon: Home },
      { label: "Rent & payments", href: `${base}/rent`, icon: PoundSterling },
      { label: "Maintenance", href: `${base}/maintenance`, icon: Wrench },
      { label: "Documents", href: `${base}/documents`, icon: FolderOpen },
      { label: "Viewings", href: `${base}/viewings`, icon: CalendarCheck },
      { label: "Messages", href: `${base}/messages`, icon: MessageSquare },
    ] },
    { label: "SYSTEM", items: [{ label: "Settings", href: `${base}/settings`, icon: Settings }] },
  ],
  workspaceHref: `${base}/settings`,
  accountHref: `${base}/settings`,
}

export default function TenantShell({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortalShell title="Tenant portal" navConfig={navConfig}>{children}</AuthenticatedPortalShell>
}
