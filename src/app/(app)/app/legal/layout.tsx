import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"
import { LegalTabNav } from "@/components/legal/LegalTabNav"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { LegalJurisdictionNote } from "@/components/legal/LegalJurisdictionNote"
import JurisdictionBanner from "@/components/i18n/JurisdictionBanner"

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  // QA all-flags bypass
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("legalSection", { supabase })
    if (!enabled) {
      redirect("/property-manager/compliance")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 -mx-6 -mt-6">
      {/* Canonical section header: title above the persistent tab rail */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Legal</h1>
        <p className="mt-1 text-sm text-slate-500">Notices, cases, possession and statutory compliance.</p>
      </div>
      <LegalTabNav />
      {/* Persistent, non-dismissible legal disclaimer on every legal page. */}
      <div className="px-6 pt-4">
        <JurisdictionBanner />
        <LegalDisclaimer />
      </div>
      <div className="flex-1">{children}</div>
      {/* Jurisdiction-aware footer note — reads the workspace country/region and
          shows the correct statutory disclaimer (reviewed England & Wales wording,
          or the research-only "verify locally" wording for every other
          jurisdiction). Mirrors the Compliance section. */}
      <div className="px-6 pb-6">
        <LegalJurisdictionNote />
      </div>
    </div>
  )
}
