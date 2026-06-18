import type { ReactNode } from "react"
import { SupplierCalendarSection } from "../_sections/providers"

export default function SupplierCalendarLayout({ children }: { children: ReactNode }) {
  return <SupplierCalendarSection>{children}</SupplierCalendarSection>
}
