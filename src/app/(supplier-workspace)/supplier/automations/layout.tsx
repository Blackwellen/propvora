import type { ReactNode } from "react"
import { SupplierAutomationsSection } from "../_sections/providers"

export default function SupplierAutomationsLayout({ children }: { children: ReactNode }) {
  return <SupplierAutomationsSection>{children}</SupplierAutomationsSection>
}
