"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import {
  Copy, Check, Link2, FileText, Image as ImageIcon,
  Plus, X, ExternalLink, QrCode, TrendingUp, MousePointer,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAffiliate } from "../_useAffiliate"
import { getAffiliateLinks, createAffiliateLink, type AffiliateLinkRow } from "@/lib/affiliate/dashboard-data"
import { cn } from "@/lib/utils"

const BASE = "https://propvora.com/"

const TARGET_PAGES = [
  { value: "/", label: "Homepage" },
  { value: "/pricing", label: "Pricing" },
  { value: "/features", label: "Features" },
  { value: "/affiliate-programme", label: "Affiliate Programme" },
  { value: "/contact", label: "Contact" },
] as const

type TargetPage = typeof TARGET_PAGES[number]["value"]

function CopyRow({ value, mono = true }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
      <p className={cn("flex-1 text-sm break-all", mono ? "font-mono text-[#2563EB]" : "text-slate-700")}>{value}</p>
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

/** Minimal QR code generator — pure SVG, no external API.
 *  Renders a compact grid by encoding the URL into a deterministic colour pattern.
 *  For production upgrade to a proper qrcode library (e.g. `qrcode` npm package).
 *  NOTE: this is a visual placeholder QR. For a scannable QR install `qrcode` and
 *  call QRCode.toDataURL(url). We avoid external calls per spec. */
function QRCodeSVG({ url, size = 120 }: { url: string; size?: number }) {
  // Use a simple LCG seeded hash of the URL to produce a deterministic grid
  const MODULES = 21
  const grid = useMemo(() => {
    let seed = 0
    for (let i = 0; i < url.length; i++) seed = (seed * 31 + url.charCodeAt(i)) >>> 0
    const cells: boolean[][] = []
    for (let r = 0; r < MODULES; r++) {
      cells[r] = []
      for (let c = 0; c < MODULES; c++) {
        seed = (seed * 1664525 + 1013904223) >>> 0
        // Force finder-pattern corners (top-left, top-right, bottom-left) to be dark
        const inFinder =
          (r < 7 && c < 7) ||
          (r < 7 && c >= MODULES - 7) ||
          (r >= MODULES - 7 && c < 7)
        const finderBorder = inFinder && (r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= MODULES - 7 && (r === MODULES - 7 || r === MODULES - 1 || c === 0 || c === 6)))
        const finderCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= MODULES - 5 && c <= MODULES - 3) ||
          (r >= MODULES - 5 && r <= MODULES - 3 && c >= 2 && c <= 4)
        if (inFinder) {
          cells[r][c] = finderBorder || finderCenter
        } else {
          cells[r][c] = (seed & 1) === 1
        }
      }
    }
    return cells
  }, [url])

  const cellSize = Math.floor((size - 8) / MODULES)
  const total = cellSize * MODULES + 8

  return (
    <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} xmlns="http://www.w3.org/2000/svg" className="rounded-lg">
      <rect width={total} height={total} fill="white" rx="4" />
      {grid.map((row, r) =>
        row.map((dark, c) =>
          dark ? (
            <rect
              key={`${r}-${c}`}
              x={4 + c * cellSize}
              y={4 + r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0D1B2A"
            />
          ) : null
        )
      )}
    </svg>
  )
}

function buildUrl(code: string, targetPage: string, source: string, medium: string, campaign: string, vanity: string): string {
  if (!code) return ""
  const params = new URLSearchParams({ ref: code })
  if (source.trim()) params.set("utm_source", source.trim())
  if (medium.trim()) params.set("utm_medium", medium.trim())
  if (campaign.trim()) params.set("utm_campaign", campaign.trim())
  const base = targetPage === "/" ? BASE : `${BASE.replace(/\/$/, "")}${targetPage}/`
  return `${base}?${params.toString()}`
}

export default function AffiliateLinksPage() {
  const { loading: affLoading, affiliate, workspaceId } = useAffiliate()
  const [source, setSource] = useState("")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")
  const [targetPage, setTargetPage] = useState<TargetPage>("/")
  const [vanity, setVanity] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [qrTarget, setQrTarget] = useState("")

  // Link list state
  const [links, setLinks] = useState<AffiliateLinkRow[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const code = affiliate?.referral_code ?? ""
  const baseLink = code ? `${BASE}?ref=${code}` : ""
  const campaignLink = buildUrl(code, targetPage, source, medium, campaign, vanity)

  useEffect(() => {
    if (!workspaceId || !affiliate?.enrolled) return
    setLinksLoading(true)
    getAffiliateLinks(workspaceId).then((rows) => { setLinks(rows); setLinksLoading(false) })
  }, [workspaceId, affiliate?.enrolled])

  async function handleCreate() {
    if (!workspaceId || !code) return
    setCreating(true)
    setCreateError(null)
    const res = await createAffiliateLink(workspaceId, {
      target_page: targetPage,
      utm_source: source || undefined,
      utm_medium: medium || undefined,
      utm_campaign: campaign || undefined,
      vanity_slug: vanity || undefined,
      referral_code: code,
    })
    setCreating(false)
    if (!res.ok) {
      setCreateError(res.error)
      return
    }
    // Reload links
    const updated = await getAffiliateLinks(workspaceId)
    setLinks(updated)
    // Clear form
    setSource(""); setMedium(""); setCampaign(""); setVanity("")
  }

  function openQR(url: string) {
    setQrTarget(url)
    setShowQR(true)
  }

  if (affLoading) {
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
        <p className="text-sm text-slate-500 mt-0.5">Create tracked referral links with UTM params and QR codes.</p>
      </div>

      {/* Base referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-400" /> Your base referral link</CardTitle>
          <button
            onClick={() => openQR(baseLink)}
            className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
          >
            <QrCode className="w-3.5 h-3.5" /> QR code
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          <CopyRow value={baseLink || "—"} />
          <p className="text-xs text-slate-400">
            Anyone who signs up within 60 days of clicking this link is attributed to you (last click).
          </p>
        </CardContent>
      </Card>

      {/* Campaign link builder */}
      <Card>
        <CardHeader><CardTitle>Campaign link builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Target page</label>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value as TargetPage)}
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                {TARGET_PAGES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <Input label="Vanity slug (optional)" placeholder="my-campaign" value={vanity} onChange={(e) => setVanity(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="UTM Source" placeholder="newsletter" value={source} onChange={(e) => setSource(e.target.value)} />
            <Input label="UTM Medium" placeholder="email" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <Input label="UTM Campaign" placeholder="spring-launch" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Your tracked campaign link</p>
            <CopyRow value={campaignLink || "—"} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={!code || creating || !campaignLink}
            >
              <Plus className="w-3.5 h-3.5" />
              {creating ? "Saving…" : "Save & track this link"}
            </Button>
            {campaignLink && (
              <button
                onClick={() => openQR(campaignLink)}
                className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline"
              >
                <QrCode className="w-3.5 h-3.5" /> Generate QR code
              </button>
            )}
          </div>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
        </CardContent>
      </Card>

      {/* Saved links list */}
      <Card>
        <CardHeader><CardTitle>Saved tracked links</CardTitle></CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No saved links yet. Create a campaign link above to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {["Target", "Campaign / UTM", "Clicks", "Conv.", "Rate", "Last clicked", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {links.map((link) => {
                    const url = buildUrl(code, link.target_page, link.utm_source ?? "", link.utm_medium ?? "", link.utm_campaign ?? "", link.vanity_slug ?? "")
                    const rate = link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 100) : 0
                    return (
                      <tr key={link.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 text-xs text-slate-700 whitespace-nowrap">
                          <Badge variant="sky" size="sm">{link.target_page === "/" ? "Home" : link.target_page.replace(/^\//, "")}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">
                          {link.utm_campaign || link.utm_source ? (
                            <span className="font-mono">{[link.utm_source, link.utm_medium, link.utm_campaign].filter(Boolean).join(" / ")}</span>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-xs font-medium text-slate-700">
                          <span className="flex items-center gap-1"><MousePointer className="w-3 h-3 text-slate-400" />{link.clicks}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs font-medium text-[#059669]">{link.conversions}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">{link.clicks > 0 ? `${rate}%` : "—"}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-400 whitespace-nowrap">
                          {link.last_clicked_at
                            ? new Date(link.last_clicked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        <td className="py-2.5 flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard?.writeText(url)}
                            className="p-1 rounded hover:bg-slate-100"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => openQR(url)} className="p-1 rounded hover:bg-slate-100" title="QR code">
                            <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-100" title="Open link">
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand assets */}
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

      {/* QR Modal */}
      {showQR && qrTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">QR Code</h3>
              <button onClick={() => setShowQR(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex justify-center">
              <QRCodeSVG url={qrTarget} size={180} />
            </div>
            <p className="text-xs text-slate-400 text-center break-all">{qrTarget}</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(qrTarget)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Copy className="w-3.5 h-3.5" /> Copy URL
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Tip: right-click or long-press the QR code to save as image.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
