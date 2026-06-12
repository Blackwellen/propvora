"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateProperty } from "@/hooks/useProperties"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { Trash2, Copy, Archive } from "lucide-react"
import {
  ChevronLeft,
  Edit2,
  Mail,
  CheckCircle2,
  Eye,
  Send,
  ArrowRightLeft,
  Check,
  Building2,
  TrendingUp,
  ClipboardList,
  Activity,
} from "lucide-react"
import type { PlanningLandlordOffer, LandlordOfferStatus } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-violet-50 text-violet-700",
  negotiating: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  expired: "bg-slate-100 text-slate-500",
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
]

const TABS = [
  { key: "overview", label: "Overview", icon: Building2 },
  { key: "terms", label: "Offer Terms", icon: ClipboardList },
  { key: "financials", label: "Financials", icon: TrendingUp },
  { key: "conversion", label: "Conversion", icon: ArrowRightLeft },
  { key: "activity", label: "Activity", icon: Activity },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createProperty = useCreateProperty()

  const [offer, setOffer] = useState<PlanningLandlordOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  useEffect(() => {
    if (!id || !workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("planning_landlord_offers")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .maybeSingle()
      if (error) { setNotFound(true); setLoading(false); return } // 42P01 etc.
      if (!data) { setNotFound(true); setLoading(false); return }
      setOffer(data as PlanningLandlordOffer)
      setLoading(false)
    })()
  }, [id, workspace?.id])

  async function saveField(field: keyof PlanningLandlordOffer, value: string | number | boolean) {
    if (!offer || !workspace?.id) return
    const supabase = createClient()
    const { error } = await supabase
      .from("planning_landlord_offers")
      .update({ [field]: value })
      .eq("id", offer.id)
      .eq("workspace_id", workspace.id)
    if (error) {
      if (error.code === "42P01") { showToast("Offers table not provisioned yet"); return }
      throw error
    }
    setOffer((p) => (p ? { ...p, [field]: value } : p))
  }

  async function setStatus(status: LandlordOfferStatus, label: string) {
    try {
      const patch: Record<string, unknown> = { status }
      if (status === "sent") patch.sent_at = new Date().toISOString()
      if (status === "accepted" || status === "rejected") patch.responded_at = new Date().toISOString()
      const supabase = createClient()
      if (offer && workspace?.id) {
        const { error } = await supabase.from("planning_landlord_offers").update(patch).eq("id", offer.id).eq("workspace_id", workspace.id)
        if (error && error.code !== "42P01") throw error
        setOffer((p) => (p ? { ...p, ...patch } as PlanningLandlordOffer : p))
      }
      showToast(label)
    } catch { showToast("Could not update offer") }
  }

  async function deleteOffer() {
    if (!offer || !workspace?.id) return
    const supabase = createClient()
    try {
      const { error } = await supabase.from("planning_landlord_offers").delete().eq("id", offer.id).eq("workspace_id", workspace.id)
      if (error && error.code !== "42P01") throw error
      router.push("/app/planning/landlord-offers")
    } catch { showToast("Could not delete offer") }
  }

  async function convertToProperty() {
    if (!offer || !workspace?.id) return
    setConverting(true)
    try {
      const created = await createProperty.mutateAsync({
        workspace_id: workspace.id,
        name: offer.property_address,
        status: "active",
        is_demo: false,
        address_line1: offer.property_address,
        target_rent: offer.proposed_rent,
        notes: `Created from landlord offer ${offer.id}`,
      })
      // Link the offer to the new property + mark accepted
      const supabase = createClient()
      await supabase.from("planning_landlord_offers")
        .update({ status: "accepted", responded_at: new Date().toISOString(), notes: `${offer.notes ?? ""}\nConverted to property ${created.id}`.trim() })
        .eq("id", offer.id).eq("workspace_id", workspace.id)
      router.push(`/app/portfolio/properties/${created.id}`)
    } catch {
      showToast("Could not convert offer to property")
      setConverting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-[13px] text-slate-400">Loading offer…</div>
  }

  if (notFound || !offer) {
    return (
      <div className="p-8">
        <Link href="/app/planning/landlord-offers" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ChevronLeft className="w-4 h-4" />Back to Landlord Offers
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-[14px] font-semibold text-slate-700">Offer not found</p>
          <p className="text-[12.5px] text-slate-400 mt-1">This landlord offer doesn&apos;t exist or isn&apos;t available in your workspace.</p>
        </div>
      </div>
    )
  }

  const totalUpfront = offer.proposed_rent * 2 // deposit (1mo) + rent in advance (1mo) baseline
  const contractValue = offer.proposed_term_months ? offer.proposed_rent * offer.proposed_term_months : 0
  const isAccepted = offer.status === "accepted"

  return (
    <div className="p-8 space-y-0">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-sm text-slate-500">
        <Link href="/app/planning/landlord-offers" className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />Back to Landlord Offers
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate max-w-[280px]">{offer.property_address}</span>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 bg-[#7C3AED]">
            {offer.property_address.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Landlord Offer</h1>
              <InlineEditField
                value={offer.status}
                type="select"
                options={STATUS_OPTIONS}
                displayClassName="text-sm font-semibold"
                onSave={async (v) => { await saveField("status", v) }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              <InlineEditField
                value={offer.property_address}
                displayClassName="text-sm text-slate-500"
                onSave={async (v) => { await saveField("property_address", v) }}
              />
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_VARIANT[offer.status] ?? "bg-slate-100 text-slate-600")}>
                {offer.status}
              </span>
              {offer.proposed_term_months ? (
                <span className="text-xs text-slate-400">{offer.proposed_term_months}-month term{offer.break_clause_months ? ` · Break Mo ${offer.break_clause_months}` : ""}</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => showToast("Click any field to edit it inline")}>
              <Edit2 className="w-3.5 h-3.5" />Edit
            </Button>
            <Button size="sm" className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white" onClick={() => setStatus("sent", "Offer marked as Sent")}>
              <Mail className="w-3.5 h-3.5" />Mark Sent
            </Button>
            <ConfirmDialog title="Delete offer?" description="This permanently removes the landlord offer." confirmLabel="Delete" onConfirm={deleteOffer}>
              {(open) => (
                <ActionMenu
                  items={[
                    { label: "Mark Accepted", icon: CheckCircle2, onClick: () => setStatus("accepted", "Offer marked as Accepted") },
                    { label: "Mark Rejected", icon: Archive, onClick: () => setStatus("rejected", "Offer marked as Rejected") },
                    { label: "Duplicate", icon: Copy, onClick: () => showToast("Duplicate offer — coming soon") },
                    { label: "Delete Offer", icon: Trash2, onClick: open, variant: "danger" },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Proposed Rent", value: fmt(offer.proposed_rent), sub: "/month" },
          { label: "Term", value: offer.proposed_term_months ? `${offer.proposed_term_months} months` : "—" },
          { label: "Break Clause", value: offer.break_clause_months ? `Month ${offer.break_clause_months}` : "None" },
          { label: "Bills Included", value: offer.bills_included ? "Yes" : "No" },
          { label: "Contract Value", value: contractValue > 0 ? fmt(contractValue) : "—", highlight: true },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("rounded-2xl border p-4", kpi.highlight ? "bg-violet-50 border-violet-100" : "bg-white border-[#E2E8F0] shadow-sm")}>
            <p className="text-xs font-medium text-slate-400 mb-1.5">{kpi.label}</p>
            <p className={cn("text-lg font-bold", kpi.highlight ? "text-[#7C3AED]" : "text-slate-900")}>{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl">
        <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active ? "border-[#7C3AED] text-[#7C3AED]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />{tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-[#E2E8F0] shadow-sm p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">Offer Summary</p>
              </div>
              <div>
                {[
                  { label: "Property", node: <InlineEditField value={offer.property_address} displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("property_address", v) }} /> },
                  { label: "Proposed Rent", node: <InlineEditField value={offer.proposed_rent} type="number" prefix="£" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("proposed_rent", Number(v)) }} /> },
                  { label: "Term (months)", node: <InlineEditField value={offer.proposed_term_months ?? ""} type="number" placeholder="Not set" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("proposed_term_months", Number(v)) }} /> },
                  { label: "Break Clause (month)", node: <InlineEditField value={offer.break_clause_months ?? ""} type="number" placeholder="None" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("break_clause_months", Number(v)) }} /> },
                  { label: "Management Fee Included", node: <span className="font-medium text-slate-900">{offer.management_fee_included ? "Yes" : "No"}</span> },
                  { label: "Bills Included", node: <span className="font-medium text-slate-900">{offer.bills_included ? "Yes" : "No"}</span> },
                  { label: "Sent", node: <span className="font-medium text-slate-900">{fmtDate(offer.sent_at)}</span> },
                  { label: "Responded", node: <span className="font-medium text-slate-900">{fmtDate(offer.responded_at)}</span> },
                ].map((row, i) => (
                  <div key={row.label} className={cn("flex items-center justify-between px-5 py-3 text-sm border-b border-slate-50 last:border-0", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                    <span className="text-slate-500">{row.label}</span>
                    {row.node}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Notes</p>
                <InlineEditField
                  value={offer.notes ?? ""}
                  type="textarea"
                  placeholder="Add notes about this offer…"
                  displayClassName="text-sm text-slate-700"
                  onSave={async (v) => { await saveField("notes", v) }}
                />
              </div>
              {offer.planning_set_id && (
                <Link href={`/app/planning/sets/${offer.planning_set_id}/overview`} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-slate-300 transition-colors block">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Linked Planning Set</p>
                  <p className="text-sm font-semibold text-[#7C3AED]">View planning set →</p>
                </Link>
              )}
              {isAccepted && (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                  <p className="text-xs font-semibold text-[#059669] uppercase tracking-wide mb-2">Next Action</p>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Convert to Property</p>
                  <p className="text-xs text-slate-500 mb-3">Offer accepted — ready to create the property record.</p>
                  <Button size="sm" className="bg-[#059669] hover:bg-[#047857] text-white w-full" onClick={() => setActiveTab("conversion")}>
                    <ArrowRightLeft className="w-3.5 h-3.5" />Go to Conversion
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "terms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rent & Term</p>
              </div>
              <div>
                <div className="flex justify-between px-5 py-3 text-sm border-b border-slate-50">
                  <span className="text-slate-500">Monthly Rent</span>
                  <InlineEditField value={offer.proposed_rent} type="number" prefix="£" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("proposed_rent", Number(v)) }} />
                </div>
                <div className="flex justify-between px-5 py-3 text-sm border-b border-slate-50 bg-slate-50/50">
                  <span className="text-slate-500">Term (months)</span>
                  <InlineEditField value={offer.proposed_term_months ?? ""} type="number" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("proposed_term_months", Number(v)) }} />
                </div>
                <div className="flex justify-between px-5 py-3 text-sm">
                  <span className="text-slate-500">Break Clause (month)</span>
                  <InlineEditField value={offer.break_clause_months ?? ""} type="number" displayClassName="font-medium text-slate-900" onSave={async (v) => { await saveField("break_clause_months", Number(v)) }} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inclusions</p>
              </div>
              <div>
                <div className="flex justify-between items-center px-5 py-3 text-sm border-b border-slate-50">
                  <span className="text-slate-500">Bills Included</span>
                  <button onClick={() => void saveField("bills_included", !offer.bills_included)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg", offer.bills_included ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {offer.bills_included ? "Yes" : "No"}
                  </button>
                </div>
                <div className="flex justify-between items-center px-5 py-3 text-sm bg-slate-50/50">
                  <span className="text-slate-500">Management Fee Included</span>
                  <button onClick={() => void saveField("management_fee_included", !offer.management_fee_included)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg", offer.management_fee_included ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {offer.management_fee_included ? "Yes" : "No"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Proposed Rent", value: fmt(offer.proposed_rent) + "/mo", colour: "#DC2626" },
              { label: "Indicative Upfront", value: fmt(totalUpfront), colour: "#7C3AED" },
              { label: "Annual Rent Cost", value: fmt(offer.proposed_rent * 12) + "/yr", colour: "#2563EB" },
              { label: "Total Contract Value", value: contractValue > 0 ? fmt(contractValue) : "—", colour: "#059669" },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4">
                <p className="text-xs font-medium text-slate-400 mb-2">{k.label}</p>
                <p className="text-xl font-bold" style={{ color: k.colour }}>{k.value}</p>
              </div>
            ))}
            <p className="col-span-2 md:col-span-4 text-[12px] text-slate-400 mt-1">
              Indicative upfront assumes a 1-month deposit plus 1 month&apos;s rent in advance. Full operator margin is modelled on the linked planning set.
            </p>
          </div>
        )}

        {activeTab === "conversion" && (
          <div className="max-w-xl">
            <div className={cn("rounded-2xl border p-6 text-center", isAccepted ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", isAccepted ? "bg-[#059669]" : "bg-slate-300")}>
                <ArrowRightLeft className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isAccepted ? "Ready to Convert" : "Offer Not Yet Accepted"}
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                {isAccepted
                  ? "Convert this accepted offer into a live property record. The offer will be linked to the new property."
                  : "Mark this offer as Accepted before converting it to a property."}
              </p>
              <ConfirmDialog
                title="Convert offer to property?"
                description={`This creates a new property "${offer.property_address}" and links it to this offer.`}
                confirmLabel="Convert"
                confirmVariant="primary"
                onConfirm={convertToProperty}
              >
                {(open) => (
                  <Button
                    size="md"
                    className={cn("text-white px-6", isAccepted ? "bg-[#059669] hover:bg-[#047857]" : "bg-slate-400 cursor-not-allowed")}
                    disabled={!isAccepted || converting}
                    onClick={open}
                  >
                    <ArrowRightLeft className="w-4 h-4" />{converting ? "Converting…" : "Convert to Property"}
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="flex flex-col gap-0">
            {[
              { label: "Offer created", date: offer.created_at, icon: ClipboardList, colour: "#7C3AED", show: true },
              { label: "Offer sent", date: offer.sent_at, icon: Send, colour: "#2563EB", show: !!offer.sent_at },
              { label: "Landlord responded", date: offer.responded_at, icon: Eye, colour: "#F59E0B", show: !!offer.responded_at },
              { label: `Marked ${offer.status}`, date: offer.updated_at, icon: CheckCircle2, colour: "#059669", show: true },
            ].filter((e) => e.show).map((event, idx, arr) => (
              <div key={event.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: event.colour }}>
                    <event.icon className="w-4 h-4" />
                  </div>
                  {idx < arr.length - 1 && <div className="w-0.5 h-10 bg-slate-100 mt-0.5" />}
                </div>
                <div className="pb-6">
                  <p className="text-sm font-semibold text-slate-900">{event.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
