"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft, MapPin, Star, BadgeCheck, ShieldCheck, Zap, Clock, Layers,
  ScrollText, Award, CalendarCheck, MessageSquare, GitCompare, CheckCircle2,
  Building2, Wrench, FileText, Info, Package, Send, Loader2, AlertCircle,
  Gauge, ClipboardList, Quote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { PriceTag, formatPence } from "@/components/marketplace/PriceTag"
import type { SupplierDetail } from "@/lib/marketplace/suppliers"

/* ──────────────────────────────────────────────────────────────────────────
   OperatorSupplierDetail — the DEEP operator (buyer) supplier surface.

   ~15 sections, every one reading REAL data from the supplier substrate
   (supplier_workspace_profiles/_services/_coverage_areas, marketplace_reviews,
   marketplace_trust_scores, supplier_insurance_policies). Sections with no real
   data render an honest empty note — nothing is fabricated.

   Primary actions are REAL: request a quote POSTs a marketplace_enquiries row
   via /api/marketplace/enquiries; "Book a service package" links to the escrow
   checkout draft when the listing supports payments. NO live Stripe here.
─────────────────────────────────────────────────────────────────────────── */

interface Section {
  id: string
  label: string
  icon: typeof Layers
  show: boolean
}

interface OperatorProperty {
  id: string
  label: string
}

interface Props {
  supplier: SupplierDetail
  /** Pre-fill from session when the operator is signed in. */
  session?: { signedIn: boolean; email?: string | null; name?: string | null; buyerWorkspaceId?: string | null }
  /** Operator's properties for the structured quote-request property selector. */
  properties?: OperatorProperty[]
}

export function OperatorSupplierDetail({ supplier: s, session, properties = [] }: Props) {
  const verified = s.verificationStatus === "verified" || s.verificationStatus === "approved"
  const canCheckout = s.paymentsEnabled && s.transactionType === "service_package"

  const sections: Section[] = [
    { id: "overview", label: "Overview", icon: Info, show: true },
    { id: "services", label: "Services & packages", icon: Package, show: s.services.length > 0 },
    { id: "pricing", label: "Pricing", icon: Gauge, show: s.services.length > 0 || s.basePricePence != null },
    { id: "coverage", label: "Coverage & zones", icon: MapPin, show: s.coverage.length > 0 || s.serviceRadiusKm != null },
    { id: "reviews", label: "Reviews", icon: Star, show: true },
    { id: "credentials", label: "Verification", icon: BadgeCheck, show: true },
    { id: "compliance", label: "Compliance docs", icon: FileText, show: s.credentials.length > 0 },
    { id: "availability", label: "Availability", icon: Clock, show: true },
    { id: "portfolio", label: "Portfolio", icon: Layers, show: s.images.length > 1 },
    { id: "terms", label: "Terms", icon: ScrollText, show: true },
    { id: "quote", label: "Request quote", icon: MessageSquare, show: true },
    { id: "orders", label: "Order history", icon: ClipboardList, show: true },
  ]
  const visible = sections.filter((x) => x.show)
  const [active, setActive] = useState(visible[0]?.id ?? "overview")

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8">
      <Link href="/app/marketplace/suppliers" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to suppliers
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]">
          {s.images[0] && <Image src={s.images[0]} alt={s.title} fill className="object-cover" sizes="(max-width:1024px) 100vw, 1280px" priority />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-4 sm:left-6 right-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {verified && <Badge tone="blue" icon={<BadgeCheck className="w-3 h-3" />}>Verified supplier</Badge>}
                {s.insuranceVerified && <Badge tone="emerald" icon={<ShieldCheck className="w-3 h-3" />}>Insured</Badge>}
                {s.acceptsEmergency && <Badge tone="red" icon={<Zap className="w-3 h-3" />}>Emergency available</Badge>}
              </div>
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-white leading-tight drop-shadow-sm">{s.title}</h1>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-slate-500 border-b border-slate-100">
          {(s.location || s.baseLocation) && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.location ?? s.baseLocation}</span>}
          {s.rating != null && s.rating > 0 && <span className="inline-flex items-center gap-1 font-semibold text-slate-700"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}{s.reviewCount != null && <span className="font-normal text-slate-400"> · {s.reviewCount} reviews</span>}</span>}
          {s.responseTimeHours != null && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Responds in ~{s.responseTimeHours}h</span>}
          {s.yearsExperience != null && <span className="inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-400" /> {s.yearsExperience} yrs experience</span>}
          {s.serviceCount > 0 && <span className="inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> {s.serviceCount} services</span>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: sticky tab nav + sections */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tab nav */}
          <div className="sticky top-[60px] z-10 -mx-1 px-1">
            <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-1 shadow-sm">
              {visible.map((sec) => {
                const SecIcon = sec.icon
                return (
                  <button key={sec.id} onClick={() => { setActive(sec.id); document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }) }} className={cn("inline-flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-lg text-[12px] font-semibold transition-colors", active === sec.id ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-100")}>
                    <SecIcon className="w-3.5 h-3.5" /> {sec.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Overview */}
          <Card id="overview" title="Overview" icon={Info}>
            {s.bio || s.description ? (
              <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">{s.bio ?? s.description}</p>
            ) : (
              <Empty>This supplier hasn&apos;t added an overview yet.</Empty>
            )}
            {s.trades.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Trades</h4>
                <div className="flex flex-wrap gap-1.5">
                  {s.trades.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 capitalize"><Wrench className="w-3 h-3 text-slate-400" /> {t}</span>)}
                </div>
              </div>
            )}
          </Card>

          {/* Services & packages */}
          {s.services.length > 0 && (
            <Card id="services" title="Services & packages" icon={Package}>
              <div className="flex flex-col divide-y divide-slate-100">
                {s.services.map((sv) => (
                  <div key={sv.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800">{sv.name}</p>
                      {sv.category && <span className="inline-flex mt-0.5 rounded-md bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-500 capitalize">{sv.category}</span>}
                      {sv.description && <p className="mt-1 text-[12.5px] text-slate-500 line-clamp-2">{sv.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <PriceTag pence={sv.ratePence} currency={s.currency} pricingModel={sv.pricingModel} size="sm" emptyLabel="On quote" />
                      {sv.calloutFeePence != null && sv.calloutFeePence > 0 && <p className="text-[11px] text-slate-400 mt-0.5">+{formatPence(sv.calloutFeePence, s.currency)} call-out</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pricing */}
          {(s.services.length > 0 || s.basePricePence != null) && (
            <Card id="pricing" title="Pricing" icon={Gauge}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="From" value={formatPence(s.priceBand.minPence ?? s.basePricePence, s.currency)} />
                {s.priceBand.maxPence != null && <Stat label="Up to" value={formatPence(s.priceBand.maxPence, s.currency)} />}
                <Stat label="Price band" value={s.priceBand.band === "quote" ? "On request" : s.priceBand.band.charAt(0).toUpperCase() + s.priceBand.band.slice(1)} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-slate-400"><Info className="w-3.5 h-3.5 shrink-0" /> Final pricing is confirmed on your quote. Payments are held in escrow and released on completion.</p>
            </Card>
          )}

          {/* Coverage */}
          {(s.coverage.length > 0 || s.serviceRadiusKm != null) && (
            <Card id="coverage" title="Coverage & zones" icon={MapPin}>
              {s.serviceRadiusKm != null && <p className="text-[13px] text-slate-600 mb-2.5">Serves jobs within <span className="font-semibold text-slate-800">{s.serviceRadiusKm}km</span> of {s.baseLocation ?? "their base"}.</p>}
              {s.coverage.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {s.coverage.map((z) => (
                    <span key={z.id} className="inline-flex items-center gap-1 rounded-lg bg-[#EFF6FF] border border-blue-100 px-2.5 py-1 text-[12px] font-medium text-[#2563EB]">
                      <MapPin className="w-3 h-3" /> {z.areaType === "national" ? "Nationwide" : z.value ?? z.areaType}{z.radiusKm != null ? ` (${z.radiusKm}km)` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <Empty>No named coverage zones declared.</Empty>
              )}
            </Card>
          )}

          {/* Reviews */}
          <Card id="reviews" title="Reviews" icon={Star}>
            {s.reviews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {s.rating != null && s.rating > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="text-[28px] font-black text-slate-900 tabular-nums">{s.rating.toFixed(1)}</span>
                    <div>
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-4 h-4", i < Math.round(s.rating!) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />)}</div>
                      <p className="text-[11.5px] text-slate-400">{s.reviewCount ?? s.reviews.length} verified reviews</p>
                    </div>
                  </div>
                )}
                {s.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />)}</div>
                      {r.createdAt && <span className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-GB")}</span>}
                    </div>
                    {r.title && <p className="mt-1.5 text-[13px] font-semibold text-slate-800">{r.title}</p>}
                    {r.body && <p className="mt-0.5 text-[12.5px] text-slate-600 inline-flex gap-1"><Quote className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />{r.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No reviews yet. Be the first to work with this supplier and leave one.</Empty>
            )}
          </Card>

          {/* Credentials / verification */}
          <Card id="credentials" title="Verification & credentials" icon={BadgeCheck}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <CredRow ok={verified} label="Identity verified" detail={verified ? "Confirmed by Propvora" : "Not yet verified"} />
              <CredRow ok={s.insuranceVerified} label="Insurance verified" detail={s.publicLiabilityCoverPence != null ? `${formatPence(s.publicLiabilityCoverPence, s.currency)} public liability` : s.insuranceVerified ? "On file" : "Not provided"} />
              <CredRow ok={s.yearsExperience != null && s.yearsExperience >= 2} label="Established track record" detail={s.yearsExperience != null ? `${s.yearsExperience} years trading` : "Unknown"} />
              <CredRow ok={(s.reviewCount ?? 0) >= 3} label="Proven on Propvora" detail={`${s.reviewCount ?? 0} completed reviews`} />
            </div>
          </Card>

          {/* Compliance docs */}
          {s.credentials.length > 0 && (
            <Card id="compliance" title="Compliance documents" icon={FileText}>
              <div className="flex flex-col divide-y divide-slate-100">
                {s.credentials.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0", c.verified ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}><ShieldCheck className="w-4 h-4" /></span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 capitalize">{c.kind.replace(/_/g, " ")}</p>
                        <p className="text-[11.5px] text-slate-400">{c.provider ?? "Provider on file"}{c.coverAmountPence != null ? ` · ${formatPence(c.coverAmountPence, s.currency)} cover` : ""}{c.expiresOn ? ` · valid to ${new Date(c.expiresOn).toLocaleDateString("en-GB")}` : ""}</p>
                      </div>
                    </div>
                    {c.verified && <span className="text-[11px] font-semibold text-emerald-600 shrink-0">Verified</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Availability */}
          <Card id="availability" title="Availability" icon={Clock}>
            <p className="text-[13px] text-slate-600">
              {s.acceptsEmergency ? "Accepts emergency call-outs and " : ""}
              {s.responseTimeHours != null ? `typically responds to quote requests within ${s.responseTimeHours} hours.` : "responds to quote requests directly — request a quote to confirm timing."}
            </p>
            {s.instantBook && <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2563EB]"><Zap className="w-3.5 h-3.5" /> Instant booking available</p>}
          </Card>

          {/* Portfolio */}
          {s.images.length > 1 && (
            <Card id="portfolio" title="Portfolio" icon={Layers}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {s.images.slice(1).map((src, i) => (
                  <div key={src + i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-100">
                    <Image src={src} alt={`${s.title} portfolio ${i + 1}`} fill className="object-cover" sizes="(max-width:640px) 50vw, 240px" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Terms */}
          <Card id="terms" title="Terms & buyer protection" icon={ScrollText}>
            <ul className="space-y-2.5 text-[13px] text-slate-600">
              <li className="flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Payments are held in escrow and released to the supplier only once the job is marked complete.</li>
              <li className="flex items-start gap-2.5"><Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> A 2.5% platform fee supports dispute resolution and buyer protection.</li>
              <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Quotes are non-binding until you accept — you confirm pricing with the supplier first.</li>
            </ul>
          </Card>

          {/* Order history (operator-scoped, real link) */}
          <Card id="orders" title="Order history" icon={ClipboardList}>
            <p className="text-[13px] text-slate-600">Your past and active orders with this supplier appear in your marketplace orders.</p>
            <Button variant="outline" size="sm" className="mt-3" asChild><Link href="/app/marketplace/orders?side=buyer"><ClipboardList className="w-4 h-4" /> View my orders</Link></Button>
          </Card>
        </div>

        {/* RIGHT: action rail */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[60px]">
          <div id="sec-quote" className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-5">
            <div className="flex items-baseline justify-between mb-1">
              <PriceTag pence={s.basePricePence ?? s.priceBand.minPence} currency={s.currency} pricingModel={s.pricingModel} size="lg" emptyLabel="Price on request" />
              {s.acceptsEmergency && <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-red-600"><Zap className="w-3.5 h-3.5" /> Emergency</span>}
            </div>
            <p className="text-[12px] text-slate-500 mb-3">Request a quote — no payment is taken until you agree pricing.</p>

            {canCheckout && (
              <Link href={`/marketplace/checkout/${s.id}`} className="w-full inline-flex items-center justify-center gap-2 h-11 mb-2.5 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.3)] hover:bg-[#1d4ed8] transition-colors">
                <CalendarCheck className="w-4 h-4" /> Book this package
              </Link>
            )}

            <QuoteRequest listingId={s.id} session={session} urgent={s.acceptsEmergency} primary={!canCheckout} properties={properties} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-[16px] shrink-0">{(s.displayName ?? s.title).charAt(0).toUpperCase() || <Building2 className="w-5 h-5" />}</div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 truncate">{s.displayName ?? s.title}</p>
                {s.rating != null && s.rating > 0 ? <p className="text-[11.5px] text-slate-400 inline-flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)} · {s.reviewCount ?? 0} reviews</p> : <p className="text-[11.5px] text-slate-400">New to Propvora</p>}
              </div>
            </div>
            <Button variant="outline" size="md" className="mt-3.5 w-full" asChild>
              <Link href={`/app/marketplace/suppliers/compare?ids=${s.id}`}><GitCompare className="w-4 h-4" /> Add to comparison</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ── Quote request — STRUCTURED operator → supplier request ────────────────────
   A signed-in operator with a workspace files a real two-sided quote request
   (property, urgency, preferred date, budget) against
   /api/marketplace/quote-requests → a `supplier_marketplace_quotes` row in
   `requested` status that lands in the supplier's leads inbox. Guests / operators
   without a workspace fall back to the lightweight enquiry write so the CTA is
   never a dead end. */
const URGENCY_OPTIONS: { value: "standard" | "urgent" | "emergency"; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
]

function QuoteRequest({
  listingId,
  session,
  urgent,
  primary,
  properties,
}: {
  listingId: string
  session?: Props["session"]
  urgent: boolean
  primary: boolean
  properties: OperatorProperty[]
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState(session?.email ?? "")
  const [propertyId, setPropertyId] = useState("")
  const [urgency, setUrgency] = useState<"standard" | "urgent" | "emergency">(urgent ? "emergency" : "standard")
  const [preferredDate, setPreferredDate] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  // Structured path only when we have a real operator workspace to attribute to.
  const structured = Boolean(session?.signedIn && session?.buyerWorkspaceId)

  async function send() {
    if (!message.trim()) {
      setError("Please describe the job, timing and location.")
      return
    }
    if (!structured && !session?.signedIn && !email.trim()) {
      setError("Please add an email so the supplier can reply.")
      return
    }
    setPhase("sending")
    setError(null)
    try {
      if (structured) {
        const selected = properties.find((p) => p.id === propertyId) ?? null
        const res = await fetch("/api/marketplace/quote-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            operatorWorkspaceId: session!.buyerWorkspaceId,
            description: message.trim(),
            propertyId: selected?.id ?? undefined,
            propertyLabel: selected?.label ?? undefined,
            urgency,
            preferredDate: preferredDate || undefined,
            budgetMin: budgetMin ? Number(budgetMin) : undefined,
            budgetMax: budgetMax ? Number(budgetMax) : undefined,
          }),
        })
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        if (!res.ok) {
          setError(data?.error ?? "We couldn't send your quote request. Please try again.")
          setPhase("idle")
          return
        }
        setPhase("done")
        return
      }

      // Fallback: lightweight enquiry write (guests / no-workspace operators).
      const res = await fetch("/api/marketplace/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message: message.trim(), email: email.trim() || undefined, buyerWorkspaceId: session?.buyerWorkspaceId ?? undefined, gdprConsent: true }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? "We couldn't send your enquiry. Please try again.")
        setPhase("idle")
        return
      }
      setPhase("done")
    } catch {
      setError("We couldn't send your request. Please try again.")
      setPhase("idle")
    }
  }

  if (phase === "done")
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-emerald-800">Quote requested</p>
          <p className="text-[12px] text-emerald-700 mt-0.5">The supplier has your request and will respond shortly. Track replies in your marketplace requests.</p>
        </div>
      </div>
    )

  if (!open)
    return (
      <Button variant={primary ? "primary" : "outline"} size="lg" className="w-full" onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4" /> {urgent ? "Request urgent call-out" : "Request a quote"}
      </Button>
    )

  return (
    <div className="space-y-2.5">
      {structured && properties.length > 0 && (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Property</span>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          >
            <option value="">Select a property (optional)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
      )}

      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Describe the job, timing and location…" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none" />

      {structured && (
        <>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Urgency</span>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={cn(
                    "h-9 rounded-xl border text-[12px] font-semibold transition-colors",
                    urgency === opt.value
                      ? opt.value === "emergency"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Preferred date</span>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Budget indication (optional, £)</span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Min"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Max"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>
        </>
      )}

      {!session?.signedIn && (
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20" />
      )}
      {error && <p className="text-[12px] text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}
      <Button variant="primary" size="lg" className="w-full" onClick={send} disabled={phase === "sending"}>
        {phase === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {phase === "sending" ? "Sending…" : "Send quote request"}
      </Button>
    </div>
  )
}

/* ── Small building blocks ─────────────────────────────────────────────────── */
function Card({ id, title, icon: Icon, children }: { id: string; title: string; icon: typeof Info; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="scroll-mt-[112px] bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-3"><Icon className="w-4 h-4 text-slate-400" /> {title}</h2>
      {children}
    </section>
  )
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-slate-400 italic">{children}</p>
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-bold text-slate-800 tabular-nums">{value}</p>
    </div>
  )
}
function CredRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
      <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0", ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-300")}>{ok ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}</span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400 truncate">{detail}</p>
      </div>
    </div>
  )
}
function Badge({ tone, icon, children }: { tone: "blue" | "emerald" | "red"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === "blue" ? "bg-white/95 text-[#2563EB]" : tone === "emerald" ? "bg-emerald-600/95 text-white" : "bg-red-600/95 text-white"
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold shadow-sm", cls)}>{icon}{children}</span>
}

export default OperatorSupplierDetail
