"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Globe2, Languages, Receipt, Shield, Scale, Gavel, MapPin, FileText,
  ShieldAlert, CreditCard, Wallet, Loader2,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"
import {
  CountryPackWarningBanner, toneFromPosture, PackStatusBadge, GateBadge, OfferStatusBadge,
} from "@/components/intl"
import { getAddressModel, addressFields } from "@/lib/i18n/address-models"
import { phoneDialCode, phonePlaceholder } from "@/lib/i18n/phone-format"
import type { IntlCountryContext } from "@/lib/context/intl-types"

type TabId =
  | "overview" | "locale" | "address" | "tax" | "privacy" | "consumer"
  | "legal" | "sanctions" | "billing" | "release" | "packs"

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "overview", label: "Overview", icon: Globe2 },
  { id: "locale", label: "Locale & format", icon: Languages },
  { id: "address", label: "Address & phone", icon: MapPin },
  { id: "tax", label: "Tax", icon: Receipt },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "consumer", label: "Consumer", icon: FileText },
  { id: "legal", label: "Legal pack", icon: Gavel },
  { id: "sanctions", label: "Sanctions", icon: ShieldAlert },
  { id: "billing", label: "Billing & payouts", icon: CreditCard },
  { id: "release", label: "Release gate", icon: Scale },
  { id: "packs", label: "Country packs", icon: Globe2 },
]

interface SelectableCountry {
  code: string
  name: string
  defaultCurrency: string | null
  defaultLocale: string | null
  legalStatus: string
  taxStatus: string
  offerStatus: string
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{value}</span>
    </div>
  )
}

export default function WorkspaceGlobalPage() {
  const { workspace } = useWorkspace()
  const [tab, setTab] = useState<TabId>("overview")
  const [intl, setIntl] = useState<IntlCountryContext | null>(null)
  const [countries, setCountries] = useState<SelectableCountry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspace?.id) return
    let alive = true
    setLoading(true)
    fetch(`/api/workspace/global?workspaceId=${workspace.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setIntl(d.intl ?? null)
        setCountries(d.countries ?? [])
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [workspace?.id])

  const tone = useMemo(() => {
    if (!intl) return "enabled" as const
    return toneFromPosture({
      countryCode: intl.countryCode,
      offerStatus: intl.offerStatus,
      canShowLegalPack: intl.gates.canShowLegalPack,
      blocked: !!intl.gates.blockedReason && intl.sanctions.isHardBlocked,
      requiresManualReview: intl.gates.requiresManualReview,
    })
  }, [intl])

  if (loading || !intl) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading global settings…
      </div>
    )
  }

  const g = intl.gates
  const addressModel = getAddressModel(intl.locale.addressModelId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Global &amp; internationalisation</h1>
        <p className="text-sm text-slate-500">
          The country posture that governs this workspace: localisation, tax, privacy, legal pack
          availability, sanctions and billing eligibility.
        </p>
      </div>

      <CountryPackWarningBanner
        countryName={intl.displayName}
        countryCode={intl.countryCode}
        tone={tone}
        reason={g.blockedReason}
        disclaimers={intl.disclaimers}
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              tab === t.id ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Section title="Country posture" description="Resolved gates for this workspace's business country.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <Row label="Country" value={`${intl.displayName} (${intl.countryCode})`} />
            <Row label="Offer status" value={<OfferStatusBadge status={intl.offerStatus} />} />
            <Row label="Self-serve SaaS" value={<GateBadge ok={g.canOfferSaas} label={g.canOfferSaas ? "Allowed" : "Blocked"} />} />
            <Row label="Billing" value={<GateBadge ok={g.canBill} label={g.canBill ? "Allowed" : "Blocked"} />} />
            <Row label="Payouts" value={<GateBadge ok={g.canTakePayouts} label={g.canTakePayouts ? "Allowed" : "Blocked"} />} />
            <Row label="Property pack" value={<GateBadge ok={g.canUsePropertyPack} label={g.canUsePropertyPack ? "Generic+" : "Off"} />} />
            <Row label="Legal pack" value={<GateBadge ok={g.canShowLegalPack} label={g.canShowLegalPack ? "Reviewed" : "Generic only"} />} />
            <Row label="Tax pack" value={<GateBadge ok={g.canShowTaxPack} label={g.canShowTaxPack ? "Reviewed" : "Generic only"} />} />
            <Row label="Manual review" value={<GateBadge ok={!g.requiresManualReview} label={g.requiresManualReview ? "Required" : "Not required"} />} />
          </div>
        </Section>
      )}

      {tab === "locale" && (
        <Section title="Locale & formatting" description="Drives currency, dates, numbers and units.">
          <Row label="Default locale" value={intl.locale.locale} />
          <Row label="Currency" value={intl.locale.currency} />
          <Row label="Supported locales" value={intl.locale.supportedLocales.join(", ")} />
          <Row label="Measurement" value={intl.locale.measurementSystem} />
          <Row label="Area unit" value={intl.locale.areaUnit} />
          <Row label="Date format" value={intl.locale.dateFormat} />
          <Row label="Phone code" value={intl.locale.phoneCountryCode ?? "—"} />
        </Section>
      )}

      {tab === "address" && (
        <Section title="Address & phone model" description="The dynamic address form rendered for this country.">
          <p className="text-[12px] text-slate-500 mb-3">Model: <span className="font-medium">{addressModel.name}</span></p>
          <div className="space-y-1.5">
            {addressFields(addressModel).map((f) => (
              <Row
                key={f.key}
                label={f.label + (f.required ? " *" : "")}
                value={f.type === "select" ? `select (${(f.options ?? []).length} options)` : "text"}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Row label="Phone prefix" value={phoneDialCode(intl.countryCode) || "—"} />
            <Row label="Example" value={phonePlaceholder(intl.countryCode)} />
          </div>
        </Section>
      )}

      {tab === "tax" && (
        <Section title="Tax" description={intl.tax.reviewed ? "Reviewed tax pack." : "Tax is generic only until reviewed — no jurisdiction-specific tax claims."}>
          <Row label="Scheme" value={intl.tax.scheme} />
          <Row label="Tax name" value={intl.tax.taxName} />
          <Row label="Standard rate" value={intl.tax.standardRate != null ? `${intl.tax.standardRate}%` : "—"} />
          <Row label="Tax ID label" value={intl.tax.taxIdLabel ?? "—"} />
          <Row label="B2B reverse charge" value={intl.tax.b2bReverseCharge ? "Yes" : "No"} />
          <Row label="Status" value={<PackStatusBadge status={intl.tax.status} />} />
        </Section>
      )}

      {tab === "privacy" && (
        <Section title="Privacy" description={intl.privacy.reviewed ? "Reviewed privacy pack." : "Privacy is generic only until reviewed."}>
          <Row label="Regime" value={intl.privacy.regime} />
          <Row label="DSAR response" value={intl.privacy.dsarResponseDays ? `${intl.privacy.dsarResponseDays} days` : "—"} />
          <Row label="Breach notify" value={intl.privacy.breachNotifyHours ? `${intl.privacy.breachNotifyHours} hours` : "—"} />
          <Row label="Consent model" value={intl.privacy.consentModel} />
          <Row label="Representative required" value={intl.privacy.representativeRequired ? "Yes" : "No"} />
          <Row label="DPO required" value={intl.privacy.dpoRequired ? "Yes" : "No"} />
          <Row label="Transfer mechanism" value={intl.privacy.transferMechanism} />
          <Row label="Status" value={<PackStatusBadge status={intl.privacy.status} />} />
        </Section>
      )}

      {tab === "consumer" && (
        <Section title="Consumer protection" description="Distance-selling / withdrawal posture.">
          <p className="text-[12.5px] text-slate-500">
            Consumer rules are reviewed for GB only. For other countries this is general information
            and must be confirmed with a local professional.
          </p>
        </Section>
      )}

      {tab === "legal" && (
        <Section title="Legal pack" description="Jurisdiction-specific legal features.">
          {g.canShowLegalPack ? (
            <p className="text-[12.5px] text-emerald-700">
              The reviewed legal pack applies. UK-specific statutes (AST, Section 21/8, HMO, Right to
              Rent, EPC, Gas Safety) are available where relevant.
            </p>
          ) : (
            <p className="text-[12.5px] text-amber-700">
              The legal pack for {intl.displayName} is not reviewed. UK property law is NOT applied to
              this country. Only generic records, documents, tasks and evidence tracking are available.
            </p>
          )}
        </Section>
      )}

      {tab === "sanctions" && (
        <Section title="Sanctions & eligibility" description="Hard-block posture enforced in code and DB.">
          <Row label="Classification" value={intl.sanctions.classification} />
          <Row label="Hard blocked" value={intl.sanctions.isHardBlocked ? "Yes" : "No"} />
          <Row label="Block onboarding" value={intl.sanctions.blockOnboarding ? "Yes" : "No"} />
          <Row label="Block billing" value={intl.sanctions.blockBilling ? "Yes" : "No"} />
          <Row label="Block payout" value={intl.sanctions.blockPayout ? "Yes" : "No"} />
          <Row label="Programmes" value={intl.sanctions.programmes.join(", ") || "—"} />
        </Section>
      )}

      {tab === "billing" && (
        <Section title="Billing & payouts" description="Stripe billing + Connect payout eligibility.">
          <Row label="Can bill" value={<GateBadge ok={g.canBill} label={g.canBill ? "Yes" : "No"} />} />
          <Row label="Can take payouts" value={<GateBadge ok={g.canTakePayouts} label={g.canTakePayouts ? "Yes" : "No"} />} />
          {!g.canBill && (
            <p className="text-[12px] text-amber-600 mt-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Billing is not available for this country yet.
            </p>
          )}
        </Section>
      )}

      {tab === "release" && (
        <Section title="Release gate" description="Whether this country pack is enabled platform-wide.">
          <Row label="State" value={intl.releaseGate.state} />
          <Row label="Enabled" value={intl.releaseGate.isEnabled ? "Yes" : "No"} />
          <Row label="Release ready" value={intl.releaseGate.releaseReady ? "Yes" : "No"} />
          <Row label="Required reviews" value={intl.releaseGate.requiredReviews.join(", ")} />
          <Row label="Approved reviews" value={intl.releaseGate.approvedReviews.join(", ") || "none"} />
          {intl.releaseGate.blockedReason && (
            <p className="text-[12px] text-amber-600 mt-3">{intl.releaseGate.blockedReason}</p>
          )}
        </Section>
      )}

      {tab === "packs" && (
        <Section title="Selectable country packs" description="Countries currently open for onboarding (offer + non-sanctioned).">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium">Country</th>
                  <th className="py-2 font-medium">Currency</th>
                  <th className="py-2 font-medium">Legal</th>
                  <th className="py-2 font-medium">Tax</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.code} className="border-b border-slate-50">
                    <td className="py-2 font-medium text-slate-800">{c.name} ({c.code})</td>
                    <td className="py-2 text-slate-600">{c.defaultCurrency ?? "—"}</td>
                    <td className="py-2"><PackStatusBadge status={c.legalStatus} /></td>
                    <td className="py-2"><PackStatusBadge status={c.taxStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  )
}
