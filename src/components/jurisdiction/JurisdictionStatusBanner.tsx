"use client"

import React from "react"
import { CheckCircle2, FlaskConical, Globe2 } from "lucide-react"
import { hiddenUkSectionsFor, SECTION_LABELS } from "@/lib/international/sections"
import type { WorkspaceJurisdiction } from "@/lib/international/workspace-jurisdiction"

/**
 * Capability / status banner for the active jurisdiction.
 *
 * GB (reviewed): a calm green "fully supported" banner — the full UK feature set
 * applies (the app behaves exactly as today). Non-reviewed: an amber banner that
 * names the country, flags reduced support, and lists the UK-specific features
 * that are switched off for this jurisdiction.
 */
export function JurisdictionStatusBanner({
  jurisdiction,
  className,
}: {
  jurisdiction: Pick<
    WorkspaceJurisdiction,
    "countryCode" | "countryName" | "effectiveStatus" | "currency" | "locale"
  >
  className?: string
}) {
  const reviewed = jurisdiction.effectiveStatus === "reviewed"
  const name =
    jurisdiction.countryName ??
    (jurisdiction.countryCode === "GB" ? "United Kingdom" : jurisdiction.countryCode)
  const hidden = hiddenUkSectionsFor(jurisdiction.countryCode)

  if (reviewed) {
    return (
      <div
        className={[
          "rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex gap-3.5",
          className ?? "",
        ].join(" ")}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-[13.5px] font-bold text-emerald-900">
            {name} — fully supported
          </p>
          <p className="text-[12.5px] text-emerald-700 mt-1 leading-relaxed">
            All Propvora features apply, including UK compliance (EPC, Gas Safety, EICR),
            tenancy and legal-readiness tools (AST, Section 21/8, HMO, Right to Rent).
          </p>
          <div className="flex flex-wrap gap-2 mt-2.5 text-[11px] text-emerald-700">
            {jurisdiction.currency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-emerald-200 px-2 py-0.5">
                <Globe2 className="w-3 h-3" /> {jurisdiction.currency}
              </span>
            )}
            {jurisdiction.locale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-emerald-200 px-2 py-0.5">
                {jurisdiction.locale}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        "rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-3.5",
        className ?? "",
      ].join(" ")}
    >
      <FlaskConical className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-amber-900">
          {name} — limited support (general information only)
        </p>
        <p className="text-[12.5px] text-amber-700 mt-1 leading-relaxed">
          Property, contacts, money, bookings and marketplace work everywhere. UK-specific
          legal, tax and compliance features are reviewed for the United Kingdom only and are
          switched off here. Anything the AI shows is general information — consult a local
          professional.
        </p>
        {hidden.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1.5">
              Not available in {name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hidden.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-white/70 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-700"
                >
                  {SECTION_LABELS[s]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
