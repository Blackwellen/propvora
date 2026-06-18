import React from "react"
import SupplierAppShell from "@/components/shells/SupplierAppShell"

export default function SupplierWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SupplierAppShell>{children}</SupplierAppShell>
}
