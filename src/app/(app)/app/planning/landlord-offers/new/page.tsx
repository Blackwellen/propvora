"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { getProfileByKey } from "@/lib/planning/profiles"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  User,
  Building2,
  FileText,
  Upload,
  Mail,
  ClipboardList,
  AlertCircle,
  X,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Steps                                                                 */
/* ------------------------------------------------------------------ */
const STEPS = [
  { id: 1, label: "Planning Set",    short: "Set" },
  { id: 2, label: "Landlord",        short: "Landlord" },
  { id: 3, label: "Offer Amount",    short: "Offer" },
  { id: 4, label: "Deposit",         short: "Deposit" },
  { id: 5, label: "Contract Terms",  short: "Terms" },
  { id: 6, label: "Responsibilities",short: "Resp." },
  { id: 7, label: "Documents",       short: "Docs" },
  { id: 8, label: "Message",         short: "Message" },
  { id: 9, label: "Review",          short: "Review" },
]

/* ------------------------------------------------------------------ */
/* Wizard state                                                          */
/* ------------------------------------------------------------------ */
interface WizardData {
  planningSetId: string
  planningSetTitle: string
  profileKey: string
  netMonthly: number
  landlordContactId: string
  landlordName: string
  landlordPhone: string
  landlordEmail: string
  landlordAddress: string
  landlordNotes: string
  isNewContact: boolean
  offerAmount: number
  marketAskingRent: number
  paymentFrequency: "monthly" | "quarterly"
  firstPaymentDue: string
  depositAmount: number
  rentInAdvanceMonths: number
  termMonths: number
  breakMonth: number
  noticePeriodMonths: number
  hasRentReview: boolean
  rentReviewMonth: number
  responsibilities: {
    maintenance: "operator" | "landlord" | "shared"
    bills: "operator" | "landlord" | "shared"
    furnishing: "operator" | "landlord" | "shared" | "unfurnished"
    compliance: "operator" | "landlord" | "shared"
    insurance: "operator" | "landlord" | "shared"
    emergencyRepairs: "operator" | "landlord" | "shared"
  }
  messageSubject: string
  messageBody: string
  saveAsTemplate: boolean
}

function makeDefaultData(): WizardData {
  return {
    planningSetId: "", planningSetTitle: "", profileKey: "", netMonthly: 0,
    landlordContactId: "", landlordName: "", landlordPhone: "", landlordEmail: "",
    landlordAddress: "", landlordNotes: "", isNewContact: false,
    offerAmount: 0, marketAskingRent: 0, paymentFrequency: "monthly", firstPaymentDue: "2026-07-01",
    depositAmount: 0, rentInAdvanceMonths: 1,
    termMonths: 36, breakMonth: 18, noticePeriodMonths: 2,
    hasRentReview: false, rentReviewMonth: 24,
    responsibilities: {
      maintenance: "operator", bills: "operator", furnishing: "operator",
      compliance: "operator", insurance: "landlord", emergencyRepairs: "shared",
    },
    messageSubject: "", messageBody: "", saveAsTemplate: false,
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */
function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function MoneyInput({ label, value, onChange, note }: { label: string; value: number; onChange: (v: number) => void; note?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
          placeholder="0"
        />
      </div>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
      />
    </div>
  )
}

type RespValue = "operator" | "landlord" | "shared" | "unfurnished"
function RespToggle({ value, onChange, options }: {
  value: string
  onChange: (v: RespValue) => void
  options: { key: RespValue; label: string }[]
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            value === o.key
              ? "bg-[#7C3AED] text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Summary rail                                                          */
/* ------------------------------------------------------------------ */
function SummaryRail({ data }: { data: WizardData }) {
  const profile = getProfileByKey(data.profileKey)
  const margin = data.netMonthly - data.offerAmount
  const marginPct = data.netMonthly > 0 ? ((margin / data.netMonthly) * 100).toFixed(1) : "—"
  const upfront = data.depositAmount + data.offerAmount * data.rentInAdvanceMonths
  const contractValue = data.offerAmount * data.termMonths

  return (
    <div className="w-72 shrink-0 sticky top-6">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offer Summary</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {data.planningSetTitle ? (
            <div>
              <p className="text-xs text-slate-400 mb-1">Planning Set</p>
              {profile && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${profile.colour}18`, color: profile.colour }}
                >
                  {data.planningSetTitle}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-300 italic">No planning set selected</div>
          )}

          {data.landlordName && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Landlord</p>
              <p className="text-sm font-medium text-slate-900">{data.landlordName}</p>
            </div>
          )}

          {data.offerAmount > 0 && (
            <>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500">Offer Amount</span>
                  <span className="font-bold text-slate-900">{fmt(data.offerAmount)}/mo</span>
                </div>
                {data.netMonthly > 0 && (
                  <>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500">Operator Margin</span>
                      <span className={cn("font-bold", margin >= 0 ? "text-[#059669]" : "text-red-600")}>
                        {fmt(margin)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500">Margin %</span>
                      <span className={cn("font-bold", Number(marginPct) >= 10 ? "text-[#059669]" : "text-amber-600")}>
                        {marginPct}%
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500">Upfront Commitment</span>
                  <span className="font-semibold text-slate-900">{fmt(upfront)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Contract Value</span>
                  <span className="font-semibold text-[#7C3AED]">{fmt(contractValue)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Wizard page                                                           */
/* ------------------------------------------------------------------ */
export default function NewLandlordOfferPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: liveSets = [] } = usePlanningSets(workspace?.id)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(makeDefaultData)
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreateOffer() {
    setCreateError(null)
    if (!workspace?.id) { setCreateError("Workspace not ready"); return }
    if (!data.landlordAddress && !data.planningSetTitle) { setCreateError("Add a property address (Step 2)"); return }
    if (data.offerAmount <= 0) { setCreateError("Set a proposed rent (Step 3)"); return }
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: inserted, error } = await supabase
        .from("planning_landlord_offers")
        .insert({
          workspace_id: workspace.id,
          planning_set_id: data.planningSetId || null,
          landlord_contact_id: null,
          property_address: data.landlordAddress || data.planningSetTitle || "Untitled property",
          proposed_rent: data.offerAmount,
          proposed_term_months: data.termMonths || null,
          break_clause_months: data.breakMonth || null,
          management_fee_included: false,
          bills_included: data.responsibilities.bills === "operator",
          notes: [data.landlordName ? `Landlord: ${data.landlordName}` : "", data.messageBody].filter(Boolean).join("\n\n") || null,
          status: "draft",
          sent_at: null,
          responded_at: null,
          is_demo: false,
        })
        .select("id")
        .single()
      if (error) throw error
      if (inserted?.id) {
        router.push(`/app/planning/landlord-offers/${inserted.id}`)
        return
      }
      router.push("/app/planning/landlord-offers")
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not create offer")
      setCreating(false)
    }
  }

  function update(updates: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...updates }))
  }

  function updateResp(key: keyof WizardData["responsibilities"], value: RespValue) {
    setData(prev => ({ ...prev, responsibilities: { ...prev.responsibilities, [key]: value } }))
  }

  const totalUpfront = data.depositAmount + data.offerAmount * data.rentInAdvanceMonths

  // Build message template from data
  function buildMessageTemplate() {
    return `Dear ${data.landlordName || "[Landlord Name]"},

Thank you for considering our offer for ${data.planningSetTitle || "[Property Address]"}.

We would like to propose a guaranteed rent arrangement as follows:
- Monthly Guaranteed Rent: ${data.offerAmount > 0 ? fmt(data.offerAmount) : "£[Amount]"}
- Contract Term: ${data.termMonths} months
- Break Clause: Month ${data.breakMonth}
- Deposit: ${fmt(data.depositAmount)}
- Rent in Advance: ${data.rentInAdvanceMonths} month(s)
- Notice Period: ${data.noticePeriodMonths} months

We take full responsibility for managing the property, ensuring all compliance requirements are met, and maintaining the property to a high standard.

We look forward to discussing this with you.

Kind regards,
[Your Name]
[Company Name]`
  }

  const canProceed = (): boolean => {
    if (step === 1) return true // planning set optional — manual entry allowed
    if (step === 2) return !!data.landlordAddress || !!data.planningSetTitle
    return true
  }

  function handleContinue() {
    if (step === 8 && !data.messageBody) {
      update({ messageSubject: `Guaranteed Rent Offer — ${data.planningSetTitle}`, messageBody: buildMessageTemplate() })
    }
    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="px-5 md:px-7 lg:px-8 max-w-[1600px] mx-auto h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/planning/landlord-offers"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Back
            </Link>
            <div className="w-px h-4 bg-slate-200" />
            <p className="text-sm font-semibold text-slate-900">New Landlord Offer</p>
            <Badge variant="default" size="sm">
              Step {step} of {STEPS.length}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 hidden sm:block">{STEPS[step - 1].label}</p>
        </div>
      </div>

      <div className="px-5 md:px-7 lg:px-8 max-w-[1600px] mx-auto py-8">
        <div className="flex gap-8 items-start">
          {/* Left stepper */}
          <div className="w-48 shrink-0 hidden lg:block">
            <div className="flex flex-col gap-1">
              {STEPS.map(s => (
                <button
                  key={s.id}
                  onClick={() => s.id < step && setStep(s.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all",
                    s.id === step ? "bg-[#7C3AED] text-white" :
                    s.id < step ? "text-[#059669] hover:bg-emerald-50 cursor-pointer" :
                    "text-slate-400 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    s.id === step ? "bg-white/20 text-white" :
                    s.id < step ? "bg-[#059669] text-white" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {s.id < step ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className="font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            {/* Mobile step indicator */}
            <div className="flex items-center gap-1 mb-6 lg:hidden overflow-x-auto pb-1">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    s.id === step ? "bg-[#7C3AED] text-white" :
                    s.id < step ? "bg-[#059669] text-white" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {s.id < step ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 rounded-full min-w-[8px]", s.id < step ? "bg-[#059669]" : "bg-slate-100")} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">

              {/* STEP 1: Select Planning Set */}
              {step === 1 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Select Planning Set</h2>
                  <p className="text-sm text-slate-500 mb-4">Choose which planning opportunity this offer relates to.</p>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search planning sets..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    {liveSets.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                        <p className="text-sm font-semibold text-slate-600">No planning sets yet</p>
                        <p className="text-xs text-slate-400 mt-1">You can still create an offer below by entering the property manually, or create a planning set first.</p>
                        <Link href="/app/planning/wizard" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#7C3AED] hover:text-violet-700">
                          Create a planning set →
                        </Link>
                      </div>
                    )}
                    {liveSets
                      .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
                      .map(ps => {
                        const profile = getProfileByKey(ps.operation_profile)
                        const selected = data.planningSetId === ps.id
                        return (
                          <button
                            key={ps.id}
                            onClick={() => update({ planningSetId: ps.id, planningSetTitle: ps.title, profileKey: ps.operation_profile, netMonthly: ps.net_monthly_income, landlordAddress: data.landlordAddress || ps.address || "" })}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all w-full",
                              selected ? "shadow-md" : "border-[#E2E8F0] hover:border-slate-300"
                            )}
                            style={selected ? { borderColor: profile?.colour ?? "#7C3AED" } : {}}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: profile?.colour ?? "#7C3AED" }}>
                              {ps.title.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{ps.title}</p>
                                {selected && <Check className="w-4 h-4 shrink-0" style={{ color: profile?.colour ?? "#7C3AED" }} />}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">{profile?.label}</span>
                                {ps.net_monthly_income > 0 && (
                                  <>
                                    <span className="text-xs text-slate-300">·</span>
                                    <span className="text-xs font-medium" style={{ color: profile?.colour ?? "#7C3AED" }}>Net: {fmt(ps.net_monthly_income)}/mo</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge variant="default" size="sm">{ps.status}</Badge>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* STEP 2: Landlord & property */}
              {step === 2 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Landlord & Property</h2>
                  <p className="text-sm text-slate-500 mb-4">Enter the property address and the landlord this offer is for.</p>

                  <div className="flex flex-col gap-4">
                    <TextInput label="Property Address" value={data.landlordAddress} onChange={v => update({ landlordAddress: v })} placeholder="48 Talbot Street, Nottingham" required />
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput label="Landlord Name" value={data.landlordName} onChange={v => update({ landlordName: v })} placeholder="Mr John Smith" />
                      <TextInput label="Phone" value={data.landlordPhone} onChange={v => update({ landlordPhone: v })} placeholder="07700 900000" />
                    </div>
                    <TextInput label="Email" value={data.landlordEmail} onChange={v => update({ landlordEmail: v })} placeholder="john@email.com" type="email" />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                      <textarea
                        value={data.landlordNotes}
                        onChange={e => update({ landlordNotes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 resize-none"
                        placeholder="Any notes about this landlord..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Offer Amount & Payment Terms */}
              {step === 3 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Offer Amount & Payment Terms</h2>
                  <p className="text-sm text-slate-500 mb-5">Set your proposed rent and payment arrangement.</p>
                  <div className="flex flex-col gap-5">
                    <MoneyInput
                      label="Proposed Monthly Guaranteed Rent (£)"
                      value={data.offerAmount}
                      onChange={v => update({ offerAmount: v })}
                      note="This is what you'll pay the landlord each month."
                    />
                    <MoneyInput
                      label="Market Asking Rent (£) — for comparison"
                      value={data.marketAskingRent}
                      onChange={v => update({ marketAskingRent: v })}
                      note="The landlord's current or expected market rent."
                    />
                    {data.marketAskingRent > 0 && data.offerAmount > 0 && (
                      <div className={cn("p-3 rounded-xl text-sm flex items-center gap-2",
                        data.offerAmount >= data.marketAskingRent ? "bg-emerald-50 text-[#059669]" : "bg-amber-50 text-amber-700"
                      )}>
                        {data.offerAmount >= data.marketAskingRent
                          ? <Check className="w-4 h-4 shrink-0" />
                          : <AlertCircle className="w-4 h-4 shrink-0" />}
                        Your offer is {data.offerAmount >= data.marketAskingRent ? "at or above" : "below"} market rate
                        ({Math.round((data.offerAmount / data.marketAskingRent) * 100)}% of asking rent)
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Payment Frequency</label>
                      <div className="flex gap-2">
                        {["monthly", "quarterly"].map(f => (
                          <button
                            key={f}
                            onClick={() => update({ paymentFrequency: f as "monthly" | "quarterly" })}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all",
                              data.paymentFrequency === f ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">First Payment Due Date</label>
                      <input
                        type="date"
                        value={data.firstPaymentDue}
                        onChange={e => update({ firstPaymentDue: e.target.value })}
                        className="h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Deposit & Advance */}
              {step === 4 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Deposit & Rent in Advance</h2>
                  <p className="text-sm text-slate-500 mb-5">Set the upfront payment commitment to the landlord.</p>
                  <div className="flex flex-col gap-5">
                    <MoneyInput
                      label="Deposit Amount (£)"
                      value={data.depositAmount}
                      onChange={v => update({ depositAmount: v })}
                      note="Typically equivalent to 1 month's rent."
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Rent in Advance (months)</label>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map(n => (
                          <button
                            key={n}
                            onClick={() => update({ rentInAdvanceMonths: n })}
                            className={cn(
                              "w-14 h-10 rounded-xl text-sm font-bold transition-all border",
                              data.rentInAdvanceMonths === n
                                ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                                : "bg-white text-slate-600 border-[#E2E8F0] hover:border-slate-300"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Number of months' rent paid upfront</p>
                    </div>

                    {/* Total upfront */}
                    <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
                      <p className="text-xs font-semibold text-[#7C3AED] mb-3">Total Upfront Payment</p>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Deposit</span>
                          <span className="font-medium text-slate-900">{fmt(data.depositAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rent in advance ({data.rentInAdvanceMonths}mo)</span>
                          <span className="font-medium text-slate-900">{fmt(data.offerAmount * data.rentInAdvanceMonths)}</span>
                        </div>
                        <div className="border-t border-violet-200 pt-2 flex justify-between">
                          <span className="font-semibold text-slate-900">Total upfront</span>
                          <span className="font-bold text-[#7C3AED] text-base">{fmt(totalUpfront)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Contract Terms */}
              {step === 5 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Contract Terms</h2>
                  <p className="text-sm text-slate-500 mb-5">Define the lease duration and exit provisions.</p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract Length (months)</label>
                      <input
                        type="number"
                        min={1}
                        value={data.termMonths}
                        onChange={e => update({ termMonths: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Break Clause (month)</label>
                      <input
                        type="number"
                        min={0}
                        value={data.breakMonth}
                        onChange={e => update({ breakMonth: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Notice Period (months)</label>
                      <input
                        type="number"
                        min={0}
                        value={data.noticePeriodMonths}
                        onChange={e => update({ noticePeriodMonths: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                      />
                    </div>
                    <div />
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Rent Review</label>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          {[{ label: "No review", val: false }, { label: "Include review", val: true }].map(opt => (
                            <button
                              key={String(opt.val)}
                              onClick={() => update({ hasRentReview: opt.val })}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                data.hasRentReview === opt.val ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {data.hasRentReview && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">at month</span>
                            <input
                              type="number"
                              min={1}
                              value={data.rentReviewMonth}
                              onChange={e => update({ rentReviewMonth: Number(e.target.value) })}
                              className="w-20 h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Term summary */}
                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Contract Summary</p>
                    <p className="text-sm text-slate-700">
                      {data.termMonths}-month lease at {fmt(data.offerAmount)}/mo
                      {data.breakMonth > 0 ? `, with a break clause at month ${data.breakMonth}` : ""}.
                      {data.noticePeriodMonths > 0 ? ` ${data.noticePeriodMonths}-month notice period.` : ""}
                      {data.hasRentReview ? ` Rent review at month ${data.rentReviewMonth}.` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 6: Responsibilities */}
              {step === 6 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Responsibility Split</h2>
                  <p className="text-sm text-slate-500 mb-5">Define who is responsible for each area of the property operation.</p>
                  <div className="flex flex-col gap-4">
                    {[
                      { key: "maintenance" as const, label: "Maintenance", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }] },
                      { key: "bills" as const, label: "Bills & Utilities", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }] },
                      { key: "furnishing" as const, label: "Furnishing", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }, { key: "unfurnished" as const, label: "Not Furnished" }] },
                      { key: "compliance" as const, label: "Compliance", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }] },
                      { key: "insurance" as const, label: "Insurance", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }] },
                      { key: "emergencyRepairs" as const, label: "Emergency Repairs", options: [{ key: "operator" as const, label: "Operator" }, { key: "landlord" as const, label: "Landlord" }, { key: "shared" as const, label: "Shared" }] },
                    ].map(row => (
                      <div key={row.key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-medium text-slate-700 min-w-[140px]">{row.label}</span>
                        <RespToggle
                          value={data.responsibilities[row.key]}
                          onChange={v => updateResp(row.key, v)}
                          options={row.options}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: Documents */}
              {step === 7 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Documents Checklist</h2>
                  <p className="text-sm text-slate-500 mb-5">Prepare and upload supporting documents for your offer.</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { name: "Heads of Terms Draft", required: true, status: "not_uploaded" },
                      { name: "Company Details / Registration", required: true, status: "not_uploaded" },
                      { name: "Reference / Proof of Funds", required: true, status: "not_uploaded" },
                      { name: "Management Agreement Template", required: false, status: "not_uploaded" },
                      { name: "Proof of Compliance Capability", required: false, status: "not_uploaded" },
                    ].map(doc => (
                      <div key={doc.name} className="flex items-center gap-4 p-4 rounded-2xl border border-[#E2E8F0] bg-white">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            {doc.required && <span className="text-xs text-red-500">Required</span>}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Not uploaded</p>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-slate-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
                          <Upload className="w-3 h-3" />Upload
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Documents can be uploaded now or after the offer is created.
                  </p>
                </div>
              )}

              {/* STEP 8: Message */}
              {step === 8 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Offer Message / Email Draft</h2>
                  <p className="text-sm text-slate-500 mb-5">Compose your message to the landlord. A template has been pre-filled from your offer details.</p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Line</label>
                      <input
                        type="text"
                        value={data.messageSubject || `Guaranteed Rent Offer — ${data.planningSetTitle}`}
                        onChange={e => update({ messageSubject: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Message Body</label>
                      <textarea
                        value={data.messageBody || buildMessageTemplate()}
                        onChange={e => update({ messageBody: e.target.value })}
                        rows={14}
                        className="w-full px-3 py-3 rounded-xl border border-[#E2E8F0] text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 resize-none leading-relaxed"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.saveAsTemplate}
                        onChange={e => update({ saveAsTemplate: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Save this message as a reusable template</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 9: Review & Create */}
              {step === 9 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Review & Create Offer</h2>
                  <p className="text-sm text-slate-500 mb-5">Review all offer terms before creating.</p>

                  <div className="flex flex-col gap-4">
                    {/* Key terms */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Offer Terms</p>
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        {[
                          ["Planning Set", data.planningSetTitle || "—"],
                          ["Landlord", data.landlordName || "—"],
                          ["Monthly Rent", data.offerAmount > 0 ? fmt(data.offerAmount) + "/mo" : "—"],
                          ["Market Asking Rent", data.marketAskingRent > 0 ? fmt(data.marketAskingRent) + "/mo" : "—"],
                          ["Contract Length", `${data.termMonths} months`],
                          ["Break Clause", data.breakMonth > 0 ? `Month ${data.breakMonth}` : "None"],
                          ["Notice Period", `${data.noticePeriodMonths} months`],
                          ["Deposit", fmt(data.depositAmount)],
                          ["Rent in Advance", `${data.rentInAdvanceMonths} month(s) — ${fmt(data.offerAmount * data.rentInAdvanceMonths)}`],
                          ["Total Upfront", fmt(totalUpfront)],
                          ["Payment Frequency", data.paymentFrequency.charAt(0).toUpperCase() + data.paymentFrequency.slice(1)],
                          ["First Payment Due", new Date(data.firstPaymentDue).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
                        ].map(([label, value], i) => (
                          <div key={String(label)} className={cn("flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100 last:border-0", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                            <span className="text-slate-500">{label}</span>
                            <span className="font-medium text-slate-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Margin analysis */}
                    {data.netMonthly > 0 && data.offerAmount > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Margin Impact</p>
                        <div className={cn("p-4 rounded-2xl border", (data.netMonthly - data.offerAmount) > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Linked net income (planning set)</span>
                            <span className="font-semibold text-slate-900">{fmt(data.netMonthly)}/mo</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Landlord guaranteed rent</span>
                            <span className="font-semibold text-slate-900">— {fmt(data.offerAmount)}/mo</span>
                          </div>
                          <div className="border-t border-emerald-200 pt-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">Operator margin</span>
                            <span className={cn("font-bold text-lg", (data.netMonthly - data.offerAmount) >= 0 ? "text-[#059669]" : "text-red-600")}>
                              {fmt(data.netMonthly - data.offerAmount)}/mo
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total contract value */}
                    <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Total Contract Value</span>
                      <span className="text-xl font-bold text-[#7C3AED]">{fmt(data.offerAmount * data.termMonths)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4" />Back
              </Button>

              {step < STEPS.length ? (
                <Button
                  size="md"
                  onClick={handleContinue}
                  disabled={!canProceed()}
                  className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={() => void handleCreateOffer()}
                  loading={creating}
                  disabled={creating}
                  className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white"
                >
                  <Check className="w-4 h-4" />Create Offer
                </Button>
              )}
            </div>
            {createError && (
              <p className="mt-3 text-[12.5px] text-red-600 text-right">{createError}</p>
            )}
          </div>

          {/* Summary rail */}
          <SummaryRail data={data} />
        </div>
      </div>
    </div>
  )
}
