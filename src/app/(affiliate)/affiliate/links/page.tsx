"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Copy, Check, Link2, FileText, Image as ImageIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAffiliate } from "../_useAffiliate"

const BASE = "https://propvora.com/"

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
      <p className="flex-1 text-sm font-mono text-[#2563EB] break-all">{value}</p>
      <button
        onClick={() => navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 shrink-0"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

export default function AffiliateLinksPage() {
  const { loading, affiliate } = useAffiliate()
  const [source, setSource] = useState("")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")

  const code = affiliate?.referral_code ?? ""
  const baseLink = code ? `${BASE}?ref=${code}` : ""

  const campaignLink = useMemo(() => {
    if (!code) return ""
    const params = new URLSearchParams({ ref: code })
    if (source.trim()) params.set("utm_source", source.trim())
    if (medium.trim()) params.set("utm_medium", medium.trim())
    if (campaign.trim()) params.set("utm_campaign", campaign.trim())
    return `${BASE}?${params.toString()}`
  }, [code, source, medium, campaign])

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven&apos;t enrolled yet. <Link href="/affiliate" className="text-[#2563EB] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Links &amp; Assets</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your referral link and a campaign builder with UTM tracking.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-400" /> Your referral link</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <CopyRow value={baseLink || "—"} />
          <p className="text-xs text-slate-400">
            Anyone who signs up within 60 days of clicking this link is attributed to you (last click).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Campaign link builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Source" placeholder="newsletter" value={source} onChange={(e) => setSource(e.target.value)} />
            <Input label="Medium" placeholder="email" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <Input label="Campaign" placeholder="spring-launch" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Your tracked campaign link</p>
            <CopyRow value={campaignLink || "—"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Brand assets &amp; guidelines</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <ImageIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">Logos &amp; banners</p>
                <p className="text-xs text-slate-400">Approved brand assets are provided on approval. Don&apos;t alter the Propvora logo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">Disclosure</p>
                <p className="text-xs text-slate-400">Always disclose your affiliate relationship. No misleading or guaranteed-earnings claims.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Full rules are in the{" "}
            <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline">Affiliate Terms</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
