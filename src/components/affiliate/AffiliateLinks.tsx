"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Copy, Check, Link2, FileText, Tag, Users, MousePointerClick,
  TrendingUp, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { COMPANY } from "@/lib/legal/company"
import { Skeleton } from "@/components/ui/Skeleton"
import { Badge } from "@/components/ui/Badge"
import { useAffiliate } from "@/components/affiliate/useAffiliate"
import { discountCodeFromHandle, DISCOUNT_LINK_PERCENT } from "@/lib/affiliate/levels"
import { getClickFunnel, type ClickFunnelData } from "@/lib/affiliate/dashboard-data"

const BASE = "https://propvora.com"

function CopyRow({ label, value, badge }: { label?: string; value: string; badge?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const hasValue = value && value !== "—"
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {badge}
        </div>
      )}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
        <p className={`flex-1 text-sm font-mono break-all ${hasValue ? "text-[var(--brand)]" : "text-slate-400"}`}>{value || "—"}</p>
        <button
          disabled={!hasValue}
          onClick={() => {
            if (!hasValue) return
            navigator.clipboard?.writeText(value)
              .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
              .catch(() => {})
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

const ASSET_TEMPLATES = [
  {
    category: "Email",
    items: [
      {
        title: "Short intro email",
        body: `Subject: This tool has changed how I manage properties

I've been using Propvora to run my property portfolio and it's honestly made a big difference — compliance reminders, rent tracking, contractor jobs, all in one place.

They're offering a free trial if you want to check it out: {LINK}

Not an affiliate pitch — just sharing what's been useful.`,
      },
      {
        title: "Newsletter snippet",
        body: `📌 Tool I'm currently using: Propvora

For any property managers or landlords reading this — if you're still juggling spreadsheets, this platform brings everything together (compliance, leases, money, suppliers). Worth a look → {LINK}`,
      },
    ],
  },
  {
    category: "LinkedIn / social",
    items: [
      {
        title: "Property manager post",
        body: `Managing properties doesn't have to mean drowning in spreadsheets.

I switched to Propvora a while back and haven't looked back — compliance tracking, rent invoicing, contractor jobs, document storage, all in one workspace.

If you're a landlord or property manager still piecing things together manually, try this: {LINK}

(Yes, that's my referral link — I earn if you subscribe. But I'd only share it if I genuinely use it.)`,
      },
      {
        title: "Short LinkedIn / X post",
        body: `Property managers: stop tracking compliance in spreadsheets.

Propvora handles gas certs, EPCs, rent arrears, tenancy docs, contractor jobs — automated reminders, one dashboard.

Free trial here: {LINK}`,
      },
    ],
  },
  {
    category: "WhatsApp / direct message",
    items: [
      {
        title: "Warm intro DM",
        body: `Hey, thought you might find this useful — I've been using Propvora for property management (compliance, invoicing, that sort of thing) and it's decent. Here's my link if you want to try it: {LINK}`,
      },
    ],
  },
]

function AssetTemplate({ title, body, link }: { title: string; body: string; link: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const resolved = body.replace(/\{LINK\}/g, link)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <pre className="whitespace-pre-wrap text-xs text-slate-600 bg-slate-50 rounded-lg p-3 font-sans leading-relaxed">{resolved}</pre>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(resolved)
                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
                .catch(() => {})
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy template</>}
          </button>
        </div>
      )}
    </div>
  )
}

export function AffiliateLinks({ basePath }: { basePath: string }) {
  const { loading, affiliate, workspaceId } = useAffiliate()
  const [source, setSource] = useState("")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")
  const [funnel, setFunnel] = useState<ClickFunnelData | null>(null)
  const [funnelLoading, setFunnelLoading] = useState(false)

  const code = affiliate?.referral_code ?? ""
  const discountCode = code
    ? (affiliate?.discount_referral_code ?? discountCodeFromHandle(code))
    : ""

  const standardLink = code ? `${BASE}/?ref=${code}` : ""
  const discountLink  = discountCode ? `${BASE}/?ref=${discountCode}` : ""
  const recruitLink   = code ? `${BASE}/affiliate-programme/apply?recruited_by=${workspaceId ?? ""}` : ""

  const campaignLink = useMemo(() => {
    if (!code) return ""
    const params = new URLSearchParams({ ref: code })
    if (source.trim()) params.set("utm_source", source.trim())
    if (medium.trim()) params.set("utm_medium", medium.trim())
    if (campaign.trim()) params.set("utm_campaign", campaign.trim())
    return `${BASE}/?${params.toString()}`
  }, [code, source, medium, campaign])

  // Load click funnel when affiliate is ready
  useEffect(() => {
    if (!workspaceId || funnel !== null) return
    setFunnelLoading(true)
    getClickFunnel(workspaceId).then((d) => { setFunnel(d); setFunnelLoading(false) })
  }, [workspaceId, funnel])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">
          You haven&apos;t enrolled yet.{" "}
          <Link href={basePath} className="text-[var(--brand)] hover:underline">Join the programme</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Links &amp; Assets</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your three referral links, a campaign builder, copy-paste templates, and link performance.
        </p>
      </div>

      {/* ── Your three links ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-slate-400" /> Your referral links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Standard */}
          <CopyRow
            label="Standard link — full price"
            value={standardLink || "—"}
            badge={<Badge variant="sky" size="sm">Full price</Badge>}
          />
          <p className="text-xs text-slate-400 -mt-3">
            Use this for warm audiences — people who know you and your recommendation. Earns 10%+ commission on every paid month for 6 months.
          </p>

          {/* Discount */}
          <CopyRow
            label={`Discount link — gives the customer ${DISCOUNT_LINK_PERCENT}% off for 3 months`}
            value={discountLink || "—"}
            badge={<Badge variant="success" size="sm">{DISCOUNT_LINK_PERCENT}% off for customer</Badge>}
          />
          <p className="text-xs text-slate-400 -mt-3">
            Use this for cold audiences, ads, or when someone needs a reason to try it. The discount is absorbed
            by Propvora — your commission rate stays the same. The customer also gets a{" "}
            <strong>30-day free trial</strong> instead of the standard 14 days.
          </p>

          {/* Recruit-an-affiliate */}
          <CopyRow
            label="Recruit-an-affiliate link"
            value={recruitLink || "—"}
            badge={<Badge size="sm" className="bg-violet-50 text-violet-700">Network earn-through</Badge>}
          />
          <p className="text-xs text-slate-400 -mt-3">
            Share this with property consultants, agents or content creators. When they join and make sales,
            you earn <strong>3–5% on every customer they convert</strong> — on top of their own commission.
            One level deep only.
          </p>

          <div className="pt-1 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Always disclose that these are affiliate links where required by your platform or jurisdiction.
              Full rules in the{" "}
              <Link href="/affiliate-programme/terms" className="underline">Affiliate Terms</Link>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Campaign link builder ── */}
      <Card>
        <CardHeader><CardTitle>Campaign link builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Source" placeholder="youtube" value={source} onChange={(e) => setSource(e.target.value)} />
            <Input label="Medium" placeholder="video" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <Input label="Campaign" placeholder="spring-launch" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
          <CopyRow label="Your tracked campaign link" value={campaignLink || "—"} />
          <p className="text-xs text-slate-400">
            Add source / medium / campaign so you can see which channels convert best in your dashboard.
          </p>
        </CardContent>
      </Card>

      {/* ── Conversion funnel ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" /> Link performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : funnel ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total clicks",    value: funnel.totalClicks,      icon: MousePointerClick, colour: "text-slate-700"   },
                  { label: "Standard clicks", value: funnel.standardClicks,   icon: Link2,             colour: "text-[var(--brand)]"   },
                  { label: "Discount clicks", value: funnel.discountClicks,   icon: Tag,               colour: "text-[#059669]"   },
                  { label: "Signups",         value: funnel.signups,          icon: Users,             colour: "text-[#7C3AED]"   },
                ].map((kpi) => {
                  const Icon = kpi.icon
                  return (
                    <div key={kpi.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Icon className={`w-4 h-4 mb-1.5 ${kpi.colour}`} />
                      <p className={`text-lg font-bold leading-none ${kpi.colour}`}>{kpi.value}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{kpi.label}</p>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {funnel.paidConversions} paid conversions
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {funnel.conversionRate}% of signups converted to paid
                  </p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{funnel.conversionRate}%</p>
              </div>

              {funnel.byCampaign.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Clicks by campaign (top 5)</p>
                  <div className="space-y-1.5">
                    {funnel.byCampaign.map((c) => (
                      <div key={c.campaign} className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-slate-400 w-24 truncate">{c.campaign}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-[var(--brand)] rounded-full"
                            style={{ width: `${Math.min(100, (c.clicks / (funnel.totalClicks || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-600 w-8 text-right">{c.clicks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {funnel.totalClicks === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No clicks recorded yet. Share your links to see performance data here.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              Could not load performance data. Please refresh.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Copy-paste asset templates ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Ready-to-use copy templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            Copy-paste these and swap in your own link. Use the standard link for warm audiences,
            the discount link for cold / ad audiences.
          </p>
          {ASSET_TEMPLATES.map((section) => (
            <div key={section.category}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {section.category}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <AssetTemplate
                    key={item.title}
                    title={item.title}
                    body={item.body}
                    link={standardLink}
                  />
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1">
            Always add your own disclosure. Full rules:{" "}
            <Link href="/affiliate-programme/terms" className="text-[var(--brand)] hover:underline">Affiliate Terms</Link>.
          </p>
        </CardContent>
      </Card>

      {/* ── Brand guidelines ── */}
      <Card>
        <CardHeader><CardTitle>Brand guidelines</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> You may refer to Propvora by name and describe it accurately.</li>
            <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Brand logos and banners are provided on approval — email <a href={`mailto:${COMPANY.emails.support}`} className="text-[var(--brand)] hover:underline">{COMPANY.emails.support}</a>.</li>
            <li className="flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" /> Do not alter the Propvora logo or create your own branded version.</li>
            <li className="flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" /> Do not make guaranteed-earnings claims on Propvora&apos;s behalf.</li>
            <li className="flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" /> Do not run paid ads on &quot;Propvora&quot; as a keyword without prior written approval.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
