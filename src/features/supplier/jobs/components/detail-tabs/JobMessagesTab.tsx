"use client"

import Link from "next/link"
import { SupplierCard } from "@/components/supplier-workspace/ui"

export function JobMessagesTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Messages</h2>
      <p className="text-sm text-slate-500">
        Job messaging with the property manager runs through your workspace inbox. Open{" "}
        <Link href="/supplier/messages" className="font-semibold text-[#2563EB]">
          Messages
        </Link>{" "}
        to see the full thread.
      </p>
    </SupplierCard>
  )
}
