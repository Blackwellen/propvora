import type { ReactNode } from "react"
import { SupplierMessagesSection } from "../_sections/providers"

export default function SupplierMessagesLayout({ children }: { children: ReactNode }) {
  return <SupplierMessagesSection>{children}</SupplierMessagesSection>
}
