"use client"
import React, { useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Calendar, CheckCircle, AlertTriangle, Gavel, FileText, PoundSterling, Clock } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { resolveValue, numericCompare } from "@/lib/jurisdiction/resolve"
import { SourcedValue, NotLegalAdviceNotice } from "@/components/jurisdiction"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePossessionCase,
  useUpdatePossessionCase,
  useTenancyValiditySignals,
} from "../../../legal-data"
import {
  SECTION_8_GROUNDS,
  toSelectedGrounds,
  indicativeNoticeDays,
  groundsLabel,
  type NoticeRoute,
} from "@/lib/legal/grounds"
import { computeValidity, countWarnings } from "@/lib/legal/validity"
import { possessionRoutes } from "@/lib/legal/possession-routes"
import { usePropertyJurisdiction } from "@/lib/jurisdiction/usePropertyJurisdiction"
import { JurisdictionChip } from "@/components/jurisdiction"

export default function SelectGroundsPage() {
  return (
    <Suspense fallback={null}>
      <SelectGroundsInner />
    </Suspense>
  )
}

function SelectGroundsInner() {
  const router = useRouter()
  const params = useSearchParams()
  const caseId = params.get("case") ?? ""
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const updateCase = useUpdatePossessionCase()

  const { data: caseData } = usePossessionCase(workspaceId, caseId)
  const { data: signals } = useTenancyValiditySignals(
    workspaceId,
    caseData?.tenancy_id ?? undefined,
    caseData?.property_id
  )

  const [route, setRoute] = useState<NoticeRoute>("section_8")
  const [selected, setSelected] = useState<string[]>(["g8"])
  const [howToRent, setHowToRent] = useState(false)
  const [arrearsAmount, setArrearsAmount] = useState("")
  const [arrearsWeeks, setArrearsWeeks] = useState("")
  // Per-case notice-period override (operator changes Propvora's indicative default).
  const [overrideActive, setOverrideActive] = useState(false)
  const [overrideValue, setOverrideValue] = useState("")
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideExemption, setOverrideExemption] = useState("")
  const [saving, setSaving] = useState(false)

  // Property jurisdiction → possession routes. E&W keeps the Section 8/21 UI
  // (pack === null); other jurisdictions render their own notice routes.
  const jur = usePropertyJurisdiction(caseData?.property_id ?? undefined)
  const routesPack = possessionRoutes(jur.countryCode, jur.region)
  const isEW = routesPack === null
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const selectedRoute = routesPack?.routes.find((r) => r.id === selectedRouteId) ?? routesPack?.routes[0] ?? null

  function toggleGround(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  // Rent-arrears grounds (Ground 8 / 10 / 11) — when any is selected we capture
  // the live arrears figure so the notice preview and court bundle show the real
  // amount instead of £0. Review-only; not a legal calculation.
  const RENT_ARREARS_GROUNDS = ["g8", "g10", "g11"]
  const showArrears = isEW && route === "section_8" && selected.some((g) => RENT_ARREARS_GROUNDS.includes(g))

  // Prefill the arrears figure from any value already saved on the case.
  React.useEffect(() => {
    if (caseData?.arrears_amount != null && arrearsAmount === "") {
      setArrearsAmount(String(caseData.arrears_amount))
    }
    if (caseData?.arrears_weeks != null && arrearsWeeks === "") {
      setArrearsWeeks(String(caseData.arrears_weeks))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData?.arrears_amount, caseData?.arrears_weeks])

  const selectedGrounds = useMemo(() => toSelectedGrounds(selected), [selected])
  // Indicative notice: E&W from the Section 8/21 grounds; other jurisdictions
  // from the selected route in the possession-routes pack.
  const noticeDays = isEW
    ? indicativeNoticeDays(route, selectedGrounds)
    : selectedRoute?.noticeDays ?? 0

  // Prefill any saved override so re-entering the wizard keeps the operator's choice.
  React.useEffect(() => {
    if (caseData?.notice_period_overridden && !overrideActive) {
      setOverrideActive(true)
      if (caseData.notice_period_days != null) setOverrideValue(String(caseData.notice_period_days))
      if (caseData.notice_override_reason) setOverrideReason(caseData.notice_override_reason)
      if (caseData.notice_override_exemption) setOverrideExemption(caseData.notice_override_exemption)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData?.notice_period_overridden])

  // Resolve the notice period through the override chain: operator override (with
  // reason) ▸ Propvora's indicative default. Both are shown; going below the
  // indicative period warns (never blocks).
  const noticeResolved = useMemo(
    () =>
      resolveValue<number>(
        {
          case:
            overrideActive && overrideValue !== "" && !isNaN(Number(overrideValue))
              ? {
                  value: Number(overrideValue),
                  reason: overrideReason || undefined,
                  exemption: overrideExemption || undefined,
                }
              : null,
          sourced: {
            value: noticeDays,
            citation: "Housing Act 1988 (England & Wales) — indicative; confirm with a solicitor",
            statutoryMinimum: noticeDays,
          },
        },
        numericCompare,
      ),
    [overrideActive, overrideValue, overrideReason, overrideExemption, noticeDays],
  )

  // An override must have a valid value and a reason (for the audit trail).
  const overrideError = useMemo(() => {
    if (!overrideActive) return null
    if (overrideValue === "" || isNaN(Number(overrideValue)) || Number(overrideValue) < 0) {
      return "Enter a valid notice period in days."
    }
    if (!overrideReason.trim()) {
      return "Add a reason for the override (e.g. contractual notice, statutory exemption)."
    }
    return null
  }, [overrideActive, overrideValue, overrideReason])

  // Live validity snapshot for the chosen route.
  const validity = useMemo(() => {
    if (!signals) return null
    return computeValidity({
      route,
      depositAmount: signals.depositAmount,
      depositScheme: signals.depositScheme,
      depositProtectedAt: signals.depositProtectedAt,
      epcValid: signals.epcValid,
      gasValid: signals.gasValid,
      howToRentServed: howToRent,
      licenceValid: signals.licenceValid,
      licenceRequired: signals.licenceRequired,
    })
  }, [signals, route, howToRent])

  const warnings = countWarnings(validity)

  // Validate the optional arrears figure before we persist it.
  const arrearsError = useMemo(() => {
    if (!showArrears) return null
    if (arrearsAmount !== "" && (isNaN(Number(arrearsAmount)) || Number(arrearsAmount) < 0)) {
      return "Enter a valid arrears amount (£0 or more)."
    }
    if (arrearsWeeks !== "" && (isNaN(Number(arrearsWeeks)) || Number(arrearsWeeks) < 0)) {
      return "Enter a valid number of weeks (0 or more)."
    }
    return null
  }, [showArrears, arrearsAmount, arrearsWeeks])

  async function handleNext() {
    if (arrearsError || overrideError) return
    const ground = isEW ? groundsLabel(route, selectedGrounds) : selectedRoute?.name ?? "Notice of possession"
    if (workspaceId && caseId) {
      setSaving(true)
      try {
        await updateCase.mutateAsync({
          id: caseId,
          workspaceId,
          payload: {
            ground,
            notice_type: isEW ? route : selectedRoute?.id ?? "notice",
            grounds: isEW ? (route === "section_21" ? [] : selectedGrounds) : [],
            notice_period_days: noticeResolved.value ?? noticeDays,
            notice_period_overridden: noticeResolved.isOverridden,
            notice_override_reason: noticeResolved.isOverridden ? overrideReason || null : null,
            notice_override_exemption: noticeResolved.isOverridden ? overrideExemption || null : null,
            validity_snapshot: isEW ? (validity ?? null) : null,
            // Arrears only apply to the E&W Section 8 rent grounds.
            arrears_amount: isEW && showArrears && arrearsAmount !== "" ? Number(arrearsAmount) : null,
            arrears_weeks: isEW && showArrears && arrearsWeeks !== "" ? Number(arrearsWeeks) : null,
            status: "drafting_notice",
          },
        })
      } catch {
        /* non-blocking — continue wizard */
      } finally {
        setSaving(false)
      }
    }
    router.push(`/property-manager/legal/possession/new/review-evidence?case=${caseId}`)
  }

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Notice Draft</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Draft
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-slate-600">Route</span>
            <span className="text-[12px] font-semibold text-slate-800 text-right">
              {isEW ? (route === "section_21" ? "Section 21" : "Section 8") : selectedRoute?.name ?? routesPack?.regionName}
            </span>
          </div>
          {isEW && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-600">Ground(s)</span>
              <span className="text-[12px] font-semibold text-slate-800">
                {route === "section_21" ? "No-fault" : selected.length || 0}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[12px] text-slate-600">Indicative notice</span>
            <span className="text-[14px] font-bold text-slate-900">{noticeDays} days</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Indicative only. Notice periods vary by ground and current legislation — confirm with your solicitor.
          </p>
        </div>
      </div>

      {/* Live validity checks (England & Wales — deposit/EPC/gas/RtR prerequisites) */}
      {isEW && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Validity Checks</h3>
          {validity && (
            <span
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                warnings > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {warnings > 0 ? `${warnings} to review` : "No blockers"}
            </span>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          {!validity ? (
            <p className="text-[11px] text-slate-400">Loading live signals…</p>
          ) : (
            validity.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                {c.status === "pass" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : c.status === "warn" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-700">{c.label}</p>
                  <p className="text-[10px] text-slate-400 leading-snug">{c.detail}</p>
                </div>
              </div>
            ))
          )}
          {route === "section_21" && (
            <label className="mt-2 flex items-start gap-2 cursor-pointer border-t border-slate-100 pt-3">
              <input
                type="checkbox"
                checked={howToRent}
                onChange={(e) => setHowToRent(e.target.checked)}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <span className="text-[11px] text-slate-600">
                I confirm the current How-to-Rent guide was served at the start of the tenancy.
              </span>
            </label>
          )}
        </div>
      </div>
      )}
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={2}
      rightRail={rightRail}
      nextDisabled={(route === "section_8" && selected.length === 0) || !!arrearsError || !!overrideError || saving}
      showSaveDraft={false}
      backLabel="Back"
      nextLabel={saving ? "Saving…" : "Next: Review Evidence"}
      onBack={() => router.push(`/property-manager/legal/possession/new/select-tenancy`)}
      onNext={handleNext}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Choose Possession Route &amp; Grounds</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select the route and (for Section 8) one or more grounds. These are reference labels — confirm applicability
          with a qualified solicitor.
        </p>

        <LegalDisclaimer variant="inline" className="mb-4" />

        {/* Record-true jurisdiction of the property this case concerns. */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-slate-500">Jurisdiction:</span>
          <JurisdictionChip countryCode={jur.countryCode} region={jur.region} name={jur.legal.regionName} locked />
        </div>

        {/* Non-E&W jurisdictions: their own notice routes. */}
        {!isEW && routesPack && (
          <div className="mb-5 space-y-3">
            <div className="rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)]/50 p-3">
              <p className="text-[12px] text-slate-700">
                <span className="font-semibold">{routesPack.regionName}</span> uses different possession routes from
                England &amp; Wales. Select the applicable route — the indicative notice period feeds the panel below and
                can be overridden.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Authority: {routesPack.authority}</p>
            </div>
            {routesPack.routes.map((r) => {
              const active = (selectedRoute?.id ?? routesPack.routes[0].id) === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${active ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-slate-800">{r.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      {r.noticeDays != null ? `${r.noticeDays}d notice` : "set notice period"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{r.basis}{r.note ? ` · ${r.note}` : ""}</p>
                  {active && r.grounds && r.grounds.length > 0 && (
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {r.grounds.map((g) => (
                        <li key={g.id} className="text-[11px] text-slate-500">• {g.name}</li>
                      ))}
                    </ul>
                  )}
                </button>
              )
            })}
            <p className="text-[11px] text-slate-400">{routesPack.citation}</p>
          </div>
        )}

        {/* Route selector (England & Wales) */}
        {isEW && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            {
              id: "section_8" as NoticeRoute,
              icon: Gavel,
              title: "Section 8",
              sub: "Fault-based — relies on statutory grounds (e.g. rent arrears, breach).",
            },
            {
              id: "section_21" as NoticeRoute,
              icon: FileText,
              title: "Section 21",
              sub: "No-fault — only valid when all prerequisites are met (see checks).",
            },
          ].map((r) => {
            const Icon = r.icon
            const active = route === r.id
            return (
              <button
                key={r.id}
                onClick={() => setRoute(r.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  active ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? "bg-[var(--color-brand-100)] text-[var(--brand)]" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{r.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{r.sub}</p>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-[var(--brand-soft)] border border-[var(--color-brand-100)] px-3 py-1.5 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span className="text-[11px] font-medium text-[var(--brand)]">Reference guidance only</span>
          </div>
        </div>

        {route === "section_21" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Section 21 — no grounds required</h3>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              A Section 21 notice does not rely on grounds, but is only valid when prerequisites are met: deposit
              protected with prescribed information given, EPC / gas safety / How-to-Rent served, and a valid property
              licence where required. Review the live checks on the right before proceeding.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {SECTION_8_GROUNDS.map((g) => {
              const isSelected = selected.includes(g.id)
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGround(g.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? "bg-[var(--brand)] border-[var(--brand)]" : "border-slate-300 bg-white"}`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-bold text-slate-800">{g.number}</span>
                        <span className="text-[12px] font-semibold text-slate-700">— {g.name}</span>
                        {g.recommended && (
                          <span className="px-2 py-0.5 bg-[var(--color-brand-100)] text-[var(--brand)] text-[10px] font-medium rounded-full">Common</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${g.type === "Mandatory" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                          {g.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {g.noticeDays}d notice
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed mb-2">{g.description}</p>
                      <p className="text-[11px] text-slate-500 mb-1"><strong>Key requirement:</strong> {g.keyRequirement}</p>
                      <p className="text-[11px] text-slate-500"><strong>Evidence needed:</strong> {g.evidence.join(" • ")}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        </>
        )}

        {/* Rent arrears capture — shown for rent-based grounds. Feeds the notice
            preview, court bundle and case record with the real figure. */}
        {showArrears && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <PoundSterling className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800">Rent Arrears (review-only)</h3>
            </div>
            <div className="p-5">
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Record the arrears outstanding for this case. These figures appear on the draft notice summary and the
                court bundle. They are not a legal calculation — confirm the balance against your rent ledger.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="arrears-amount" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Total arrears (£)
                  </label>
                  <input
                    id="arrears-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={arrearsAmount}
                    onChange={(e) => setArrearsAmount(e.target.value)}
                    placeholder="e.g. 2400.00"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="arrears-weeks" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Weeks in arrears <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="arrears-weeks"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={arrearsWeeks}
                    onChange={(e) => setArrearsWeeks(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>
              </div>
              {arrearsError && <p className="text-[11px] text-red-600 mt-2">{arrearsError}</p>}
            </div>
          </div>
        )}

        {/* Notice period — sourced default with optional per-case override. */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800">Notice period</h3>
            </div>
            <SourcedValue
              resolved={noticeResolved}
              unit="days"
              onEdit={() => {
                setOverrideActive(true)
                if (overrideValue === "") setOverrideValue(String(noticeDays))
              }}
            />
          </div>
          <div className="p-5">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The default is Propvora&apos;s indicative notice period for the selected ground(s). You can override it for a
              contractual term or statutory exemption — both the default and your override are recorded on the case.
            </p>

            {overrideActive && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="override-days" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Notice period (days)
                  </label>
                  <input
                    id="override-days"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="override-reason" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="override-reason"
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. contractual 2-month notice"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="override-exemption" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Exemption type <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="override-exemption"
                    type="text"
                    value={overrideExemption}
                    onChange={(e) => setOverrideExemption(e.target.value)}
                    placeholder="e.g. transitional, contractual"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {overrideActive && (
              <button
                type="button"
                onClick={() => {
                  setOverrideActive(false)
                  setOverrideValue("")
                  setOverrideReason("")
                  setOverrideExemption("")
                }}
                className="mt-3 text-[11px] font-medium text-slate-500 hover:text-slate-700"
              >
                Reset to indicative default
              </button>
            )}

            {overrideError && <p className="text-[11px] text-red-600 mt-2">{overrideError}</p>}

            <NotLegalAdviceNotice variant="inline" className="mt-3" />
          </div>
        </div>
      </div>
    </PossessionWizardShell>
  )
}
