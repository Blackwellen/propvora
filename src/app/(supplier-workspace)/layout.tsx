import React from "react"
import SupplierWorkspaceShell from "@/components/shells/SupplierWorkspaceShell"

export default function SupplierWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SupplierWorkspaceShell>{children}</SupplierWorkspaceShell>
}
