import type { Metadata } from "next"
import ZonesEditor from "@/components/supplier-workspace/zones/ZonesEditor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Service zones · Propvora",
  description: "Define named service zones and assign teams to them.",
}

export default function SupplierZonesPage() {
  return <ZonesEditor />
}
