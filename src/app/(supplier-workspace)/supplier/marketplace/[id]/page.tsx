"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, LayoutGrid, FileText, Images, Tag, MapPin,
  CalendarDays, DollarSign, ShieldCheck, ShoppingBag, Star,
  BarChart2, Sparkles, Share2, Settings, History, Play, Pause,
  Upload, Trash2, Plus, ExternalLink, Check, X, ArrowRight,
  Globe, Eye, Pencil, Store,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierCard, SupplierLoadingState, SupplierNotReady, SupplierStatusBadge,
  SupplierTabs, SupplierButton, SupplierBanner, SupplierField, SupplierDrawer,
  supplierInputClass, supplierTextareaClass, toneForStatus, humaniseStatus,
  type SupplierTab,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate, timeAgo, moneyPence } from "@/components/supplier-workspace/format"
import { categoryMeta, CATEGORIES } from "@/components/marketplace"

/* ──────────────────────────────────────────────────────────────────────────
   15-tab Supplier Marketplace Listing Detail
   Constraints: no dark: classes, all data from Supabase via /api routes.
─────────────────────────────────────────────────────────────────────────── */

type ListingRow = {
  id: string
  workspace_id: string
  title: string
  description: string | null
  category: string | null
  subcategory: string | null
  status: string
  base_price_pence: number | null
  pricing_model: string | null
  currency: string
  minimum_charge_pence: number | null
  slug: string | null
  seo_title: string | null
  seo_description: string | null
  is_featured: boolean
  visibility: string | null
  cancellation_policy: string | null
  response_time_hours: number | null
  terms_included: string | null
  terms_excluded: string | null
  travel_fee_pence: number | null
  weekend_surcharge_pct: number | null
  emergency_callout_fee_pence: number | null
  deposit_required: boolean
  deposit_pct: number | null
  view_count: number | null
  enquiry_count: number | null
  order_count: number | null
  avg_rating: number | null
  review_count: number | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  tags: string[] | null
  key_features: string[] | null
  usp: string | null
  video_url: string | null
  channels: string[] | null
}

type ListingMedia = {
  id: string
  listing_id: string
  url: string
  r2_key: string
  is_cover: boolean
  position: number
  created_at: string
}

type ListingOrder = {
  id: string
  buyer_name: string | null
  status: string
  amount_pence: number | null
  currency: string
  created_at: string
}

type ListingReview = {
  id: string
  author: string | null
  rating: number
  title: string | null
  body: string | null
  created_at: string
  reply: string | null
}

type ListingAuditEntry = {
  id: string
  action: string
  field: string | null
  old_value: string | null
  new_value: string | null
  actor: string | null
  created_at: string
}

type PriceTier = {
  id?: string
  label: string
  from_hours: number | null
  to_hours: number | null
  price_pence: number
}

const TABS: SupplierTab[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "content", label: "Content", icon: FileText },
  { key: "media", label: "Media", icon: Images },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "coverage", label: "Coverage", icon: MapPin },
  { key: "availability", label: "Availability", icon: CalendarDays },
  { key: "fees", label: "Fees", icon: Tag },
  { key: "rules", label: "Rules", icon: ShieldCheck },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "performance", label: "Performance", icon: BarChart2 },
  { key: "ai", label: "AI Optimiser", icon: Sparkles },
  { key: "channels", label: "Channels", icon: Share2 },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "activity", label: "Activity", icon: History },
]

const PRICING_MODELS = [
  { value: "per_job", label: "Per job" },
  { value: "per_hour", label: "Per hour" },
  { value: "per_day", label: "Per day" },
  { value: "fixed", label: "Fixed price" },
]

export default function SupplierListingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const { workspaceId } = useSupplierWorkspace()
  const [tab, setTab] = useState("overview")
  const [banner, setBanner] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const listing = useSupplierApi<ListingRow>(
    id ? `/api/marketplace/listings/${id}` : null,
    { select: (j) => ((j as { listing?: ListingRow }).listing ?? (j as ListingRow)) }
  )

  const media = useSupplierApi<ListingMedia[]>(
    id ? `/api/marketplace/listings/${id}/media` : null,
    { select: (j) => (j as { items?: ListingMedia[] }).items ?? [] }
  )

  const orders = useSupplierApi<ListingOrder[]>(
    id && workspaceId ? `/api/marketplace/listings/${id}/orders?workspaceId=${workspaceId}` : null,
    { select: (j) => (j as { items?: ListingOrder[] }).items ?? [] }
  )

  const reviews = useSupplierApi<ListingReview[]>(
    id ? `/api/marketplace/listings/${id}/reviews` : null,
    { select: (j) => (j as { items?: ListingReview[] }).items ?? [] }
  )

  const auditLog = useSupplierApi<ListingAuditEntry[]>(
    id && workspaceId ? `/api/marketplace/listings/${id}/activity?workspaceId=${workspaceId}` : null,
    { select: (j) => (j as { items?: ListingAuditEntry[] }).items ?? [] }
  )

  const l = listing.data

  async function patch(fields: Record<string, unknown>) {
    if (!workspaceId || !id) return
    setSaving(true); setBanner(null)
    try {
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, ...fields }),
      })
      if (res.ok) {
        setBanner("Changes saved.")
        listing.refresh()
      } else {
        const j = await res.json().catch(() => null)
        setBanner((j as { error?: string } | null)?.error ?? "Couldn't save changes.")
      }
    } catch {
      setBanner("Network error — please try again.")
    } finally {
      setSaving(false) }
  }

  async function toggleStatus() {
    if (!l) return
    const next = l.status === "published" ? "paused"
      : l.status === "paused" ? "published"
      : "pending_review"
    await patch({ status: next })
  }

  if (listing.loading) {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Listing" subtitle="Loading…" showBack backHref="/supplier/marketplace" />
        <SupplierCard className="p-5"><SupplierLoadingState rows={6} /></SupplierCard>
      </div>
    )
  }

  if (listing.notReady || !l) {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Listing" subtitle="" showBack backHref="/supplier/marketplace" />
        <SupplierCard className="p-5">
          <SupplierNotReady
            icon={LayoutGrid}
            title="Listing unavailable"
            description="This listing couldn't be loaded. It may have been removed or the marketplace service is initialising."
          />
        </SupplierCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={l.title} subtitle="Listing detail" showBack backHref="/supplier/marketplace" />

      {/* Breadcrumb + title */}
      <div className="hidden md:block">
        <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-2">
          <Link href="/supplier/marketplace" className="hover:text-slate-600 inline-flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Marketplace
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{l.title}</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">{l.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {l.category ? humaniseStatus(l.category) : "No category"} · Updated {shortDate(l.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SupplierStatusBadge tone={toneForStatus(l.status)}>{humaniseStatus(l.status)}</SupplierStatusBadge>
            <SupplierButton
              variant="secondary"
              size="sm"
              onClick={() => void toggleStatus()}
              loading={saving}
            >
              {l.status === "published" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : l.status === "paused" ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><ArrowRight className="w-3.5 h-3.5" /> Submit</>}
            </SupplierButton>
            {l.status === "published" && l.slug && (
              <Link
                href={`/marketplace/${l.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View public
              </Link>
            )}
          </div>
        </div>
      </div>

      {banner && (
        <SupplierBanner
          tone={banner.toLowerCase().includes("saved") || banner.toLowerCase().includes("done") ? "emerald" : "amber"}
          onDismiss={() => setBanner(null)}
        >
          {banner}
        </SupplierBanner>
      )}

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Views", value: l.view_count ?? 0, icon: Eye },
          { label: "Orders", value: l.order_count ?? 0, icon: ShoppingBag },
          { label: "Rating", value: l.avg_rating != null ? `${l.avg_rating.toFixed(1)} ★` : "—", icon: Star },
          { label: "Reviews", value: l.review_count ?? 0, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">{label}</span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-slate-900">{String(value)}</p>
          </div>
        ))}
      </div>

      <SupplierTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div className="space-y-4">
        {tab === "overview" && <OverviewTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "content" && <ContentTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "media" && (
          <MediaTab
            listingId={id}
            workspaceId={workspaceId}
            items={media.data ?? []}
            loading={media.loading}
            refresh={media.refresh}
            onBanner={setBanner}
          />
        )}
        {tab === "pricing" && <PricingTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "coverage" && <CoverageTab workspaceId={workspaceId} />}
        {tab === "availability" && <AvailabilityTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "fees" && <FeesTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "rules" && <RulesTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "orders" && (
          <OrdersTab items={orders.data ?? []} loading={orders.loading} />
        )}
        {tab === "reviews" && (
          <ReviewsTab
            items={reviews.data ?? []}
            loading={reviews.loading}
            listingId={id}
            workspaceId={workspaceId}
            onBanner={setBanner}
            refresh={reviews.refresh}
          />
        )}
        {tab === "performance" && <PerformanceTab listing={l} />}
        {tab === "ai" && <AiOptimiserTab listing={l} workspaceId={workspaceId} onBanner={setBanner} />}
        {tab === "channels" && <ChannelsTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "settings" && <SettingsTab listing={l} onPatch={patch} saving={saving} />}
        {tab === "activity" && (
          <ActivityTab items={auditLog.data ?? []} loading={auditLog.loading} />
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 1 — Overview
══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const cat = categoryMeta(l.category)
  const CatIcon = cat.icon
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
      <SupplierCard className="p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cat.bg}`}>
            <CatIcon className={`w-7 h-7 ${cat.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{l.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <SupplierStatusBadge tone={toneForStatus(l.status)}>{humaniseStatus(l.status)}</SupplierStatusBadge>
              {l.category && <SupplierStatusBadge tone="blue">{humaniseStatus(l.category)}</SupplierStatusBadge>}
              {l.subcategory && <SupplierStatusBadge tone="slate">{humaniseStatus(l.subcategory)}</SupplierStatusBadge>}
            </div>
          </div>
        </div>
        {l.description && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{l.description}</p>
        )}
        {!l.description && (
          <p className="text-sm text-slate-400 italic">No description yet — add one in the Content tab.</p>
        )}
      </SupplierCard>

      <div className="space-y-3">
        <SupplierCard className="p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Listing details</h3>
          <dl className="space-y-2.5 text-sm">
            <FactRow label="Status" value={humaniseStatus(l.status)} />
            <FactRow label="Category" value={l.category ? humaniseStatus(l.category) : "—"} />
            <FactRow label="Pricing" value={l.pricing_model ? humaniseStatus(l.pricing_model) : "—"} />
            <FactRow label="Base price" value={moneyPence(l.base_price_pence, l.currency)} />
            <FactRow label="Published" value={shortDate(l.published_at)} />
            <FactRow label="Last updated" value={timeAgo(l.updated_at)} />
          </dl>
        </SupplierCard>
        <SupplierCard className="p-4">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Category</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const CIcon = c.icon
              const active = l.category === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => void onPatch({ category: c.key })}
                  disabled={saving}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                    active
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <CIcon className="w-3.5 h-3.5" /> {c.label}
                </button>
              )
            })}
          </div>
        </SupplierCard>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 2 — Content
══════════════════════════════════════════════════════════════════════════ */

function ContentTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const [title, setTitle] = useState(l.title)
  const [description, setDescription] = useState(l.description ?? "")
  const [usp, setUsp] = useState(l.usp ?? "")
  const [features, setFeatures] = useState<string[]>(l.key_features ?? [])
  const [tags, setTags] = useState<string[]>(l.tags ?? [])
  const [newTag, setNewTag] = useState("")
  const [newFeature, setNewFeature] = useState("")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Listing copy</h2>
        <SupplierField label="Title" required>
          <input
            className={supplierInputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() !== l.title && void onPatch({ title: title.trim() })}
          />
        </SupplierField>
        <SupplierField label="Description" hint="What's included, who it's for, what makes you different.">
          <textarea
            className={supplierTextareaClass}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (l.description ?? "") && void onPatch({ description })}
          />
        </SupplierField>
        <SupplierField label="Unique selling point (tagline)" hint="One sentence — shown on the card.">
          <input
            className={supplierInputClass}
            value={usp}
            placeholder="e.g. Same-day service guaranteed with no call-out fee"
            onChange={(e) => setUsp(e.target.value)}
            onBlur={() => usp !== (l.usp ?? "") && void onPatch({ usp })}
          />
        </SupplierField>
      </SupplierCard>

      <div className="space-y-4">
        <SupplierCard className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Key features</h2>
          <p className="text-xs text-slate-500 mb-3">Up to 8 bullet points shown on the listing.</p>
          <ul className="space-y-2 mb-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="flex-1 text-sm text-slate-700">{f}</span>
                <button
                  onClick={() => {
                    const next = features.filter((_, j) => j !== i)
                    setFeatures(next)
                    void onPatch({ key_features: next })
                  }}
                  className="p-1 text-slate-300 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {features.length < 8 && (
            <div className="flex items-center gap-2">
              <input
                className={`${supplierInputClass} flex-1`}
                placeholder="Add a feature…"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFeature.trim()) {
                    const next = [...features, newFeature.trim()]
                    setFeatures(next)
                    void onPatch({ key_features: next })
                    setNewFeature("")
                  }
                }}
              />
              <SupplierButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!newFeature.trim()) return
                  const next = [...features, newFeature.trim()]
                  setFeatures(next)
                  void onPatch({ key_features: next })
                  setNewFeature("")
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </SupplierButton>
            </div>
          )}
        </SupplierCard>

        <SupplierCard className="p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Tags / keywords</h2>
          <p className="text-xs text-slate-500 mb-3">Help buyers find your listing in search.</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-[12px] font-semibold">
                {t}
                <button
                  onClick={() => {
                    const next = tags.filter((_, j) => j !== i)
                    setTags(next)
                    void onPatch({ tags: next })
                  }}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className={`${supplierInputClass} flex-1`}
              placeholder="e.g. emergency plumbing"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTag.trim()) {
                  const next = [...tags, newTag.trim()]
                  setTags(next)
                  void onPatch({ tags: next })
                  setNewTag("")
                }
              }}
            />
            <SupplierButton
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!newTag.trim()) return
                const next = [...tags, newTag.trim()]
                setTags(next)
                void onPatch({ tags: next })
                setNewTag("")
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </SupplierButton>
          </div>
        </SupplierCard>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 3 — Media
══════════════════════════════════════════════════════════════════════════ */

function MediaTab({
  listingId, workspaceId, items, loading, refresh, onBanner,
}: {
  listingId: string; workspaceId: string | null; items: ListingMedia[]; loading: boolean; refresh: () => void; onBanner: (msg: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!workspaceId) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      form.append("folder", `marketplace/${listingId}/media`)
      const up = await fetch("/api/upload", { method: "POST", body: form })
      if (!up.ok) { onBanner("Upload failed."); return }
      const meta = await up.json()
      const rec = await fetch(`/api/marketplace/listings/${listingId}/media`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ r2Key: meta.key, url: meta.url, isCover: items.length === 0 }),
      })
      if (!rec.ok) { onBanner("Couldn't record image."); return }
      refresh()
    } catch {
      onBanner("Network error during upload.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function setCover(mediaId: string) {
    const res = await fetch(`/api/marketplace/listings/${listingId}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_cover: true }),
    })
    if (res.ok) refresh()
    else onBanner("Couldn't set cover image.")
  }

  async function deleteMedia(mediaId: string) {
    const res = await fetch(`/api/marketplace/listings/${listingId}/media/${mediaId}`, {
      method: "DELETE",
    })
    if (res.ok) refresh()
    else onBanner("Couldn't delete image.")
  }

  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">Photos &amp; media</h2>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              for (const f of files) void uploadFile(f)
            }}
          />
          <SupplierButton size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="w-3.5 h-3.5" /> Upload photos
          </SupplierButton>
        </div>
      </div>

      {loading ? (
        <SupplierLoadingState rows={3} />
      ) : items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <Images className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No photos yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload at least one photo — listings with photos get more enquiries.</p>
          <SupplierButton size="sm" className="mt-4" onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="w-3.5 h-3.5" /> Upload first photo
          </SupplierButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="Listing photo" className="w-full h-32 object-cover" />
                {item.is_cover && (
                  <span className="absolute top-2 left-2 bg-[#0D1B2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Cover</span>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.is_cover && (
                    <button
                      onClick={() => void setCover(item.id)}
                      title="Set as cover"
                      className="p-1.5 rounded-lg bg-white/90 text-slate-700 hover:text-[#2563EB]"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => void deleteMedia(item.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg bg-white/90 text-slate-700 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <SupplierField label="Video URL (optional)" hint="YouTube or Vimeo link shown below the gallery.">
          <input
            className={supplierInputClass}
            placeholder="https://youtube.com/watch?v=…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={() => void fetch(`/api/marketplace/listings/${listingId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ workspaceId, video_url: videoUrl || null }),
            }).then(() => refresh())}
          />
        </SupplierField>
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 4 — Pricing
══════════════════════════════════════════════════════════════════════════ */

function PricingTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const [pricingModel, setPricingModel] = useState(l.pricing_model ?? "per_job")
  const [basePricePence, setBasePricePence] = useState(String(l.base_price_pence ?? ""))
  const [minChargePence, setMinChargePence] = useState(String(l.minimum_charge_pence ?? ""))
  const [tiers, setTiers] = useState<PriceTier[]>([])
  const [newTierLabel, setNewTierLabel] = useState("")
  const [newTierPrice, setNewTierPrice] = useState("")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Base pricing</h2>
        <SupplierField label="Pricing model" required>
          <select
            className={supplierInputClass}
            value={pricingModel}
            onChange={(e) => {
              setPricingModel(e.target.value)
              void onPatch({ pricing_model: e.target.value })
            }}
          >
            {PRICING_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </SupplierField>

        <SupplierField label="Base price (pence)" hint="Integer pence — £100 = 10000p. Shown formatted to buyers." required>
          <input
            type="number"
            className={supplierInputClass}
            value={basePricePence}
            onChange={(e) => setBasePricePence(e.target.value)}
            onBlur={() => {
              const n = parseInt(basePricePence, 10)
              if (!isNaN(n)) void onPatch({ base_price_pence: n })
            }}
            min={0}
            step={100}
          />
          {basePricePence && !isNaN(parseInt(basePricePence, 10)) && (
            <p className="text-xs text-slate-400 mt-1">= {moneyPence(parseInt(basePricePence, 10))}</p>
          )}
        </SupplierField>

        <SupplierField label="Minimum charge (pence)" hint="Optional — the least a buyer is charged.">
          <input
            type="number"
            className={supplierInputClass}
            value={minChargePence}
            onChange={(e) => setMinChargePence(e.target.value)}
            onBlur={() => {
              const n = parseInt(minChargePence, 10)
              void onPatch({ minimum_charge_pence: isNaN(n) ? null : n })
            }}
            min={0}
            step={100}
          />
        </SupplierField>

        <SupplierField label="Currency">
          <select
            className={supplierInputClass}
            value={l.currency}
            onChange={(e) => void onPatch({ currency: e.target.value })}
          >
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — US Dollar</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="AUD">AUD — Australian Dollar</option>
          </select>
        </SupplierField>
      </SupplierCard>

      <SupplierCard className="p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Price tiers</h2>
        <p className="text-xs text-slate-500 mb-4">Optional tiered pricing — e.g. &ldquo;up to 3 hours = £150, 3–6 hours = £250&rdquo;.</p>
        <div className="space-y-2 mb-3">
          {tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{t.label}</span>
              <span className="text-sm font-semibold text-slate-900">{moneyPence(t.price_pence)}</span>
              <button
                onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                className="p-1 text-slate-300 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {tiers.length === 0 && (
            <p className="text-sm text-slate-400 py-2">No price tiers set. Buyers see the base price only.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className={`${supplierInputClass} flex-1`}
            placeholder="Label (e.g. up to 3 hrs)"
            value={newTierLabel}
            onChange={(e) => setNewTierLabel(e.target.value)}
          />
          <input
            type="number"
            className="h-10 w-24 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            placeholder="Pence"
            value={newTierPrice}
            onChange={(e) => setNewTierPrice(e.target.value)}
          />
          <SupplierButton
            size="sm"
            variant="secondary"
            disabled={!newTierLabel.trim() || !newTierPrice}
            onClick={() => {
              setTiers([...tiers, { label: newTierLabel.trim(), from_hours: null, to_hours: null, price_pence: parseInt(newTierPrice, 10) }])
              setNewTierLabel(""); setNewTierPrice("")
            }}
          >
            <Plus className="w-3.5 h-3.5" />
          </SupplierButton>
        </div>
        {tiers.length > 0 && (
          <div className="mt-3">
            <SupplierButton
              size="sm"
              loading={saving}
              onClick={() => void onPatch({ price_tiers: tiers })}
            >
              Save tiers
            </SupplierButton>
          </div>
        )}
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 5 — Coverage
══════════════════════════════════════════════════════════════════════════ */

type CoverageAreaItem = { id: string; label?: string; postcode?: string; city?: string; region?: string }

function CoverageTab({ workspaceId }: { workspaceId: string | null }) {
  const areas = useSupplierApi<CoverageAreaItem[]>(
    workspaceId ? `/api/supplier/coverage?workspaceId=${workspaceId}` : null,
    { select: (j) => ((j as { items?: CoverageAreaItem[] }).items ?? []) }
  )

  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Coverage areas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Areas where this listing can be delivered. Inherited from your workspace coverage settings.</p>
        </div>
        <Link
          href="/supplier/coverage"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
        >
          Manage areas <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {areas.loading ? (
        <SupplierLoadingState rows={3} />
      ) : !areas.data || areas.data.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No coverage areas defined</p>
          <p className="text-xs text-slate-400 mt-1">Add coverage areas in your workspace settings to show buyers where you operate.</p>
          <Link href="/supplier/coverage" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB]">
            <Plus className="w-4 h-4" /> Add coverage areas
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {areas.data.map((a) => (
            <li key={a.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{a.label ?? a.city ?? a.region ?? "Area"}</p>
                {(a.postcode || a.city) && (
                  <p className="text-xs text-slate-500">{[a.postcode, a.city, a.region].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 6 — Availability
══════════════════════════════════════════════════════════════════════════ */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DEFAULT_HOURS = { enabled: false, start: "09:00", end: "17:00" }

function AvailabilityTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  type DayConfig = { enabled: boolean; start: string; end: string }
  const [schedule, setSchedule] = useState<Record<string, DayConfig>>(
    () => Object.fromEntries(DAYS.map((d) => [d, { ...DEFAULT_HOURS }]))
  )

  function updateDay(day: string, field: keyof DayConfig, value: string | boolean) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Service hours</h2>
      <p className="text-xs text-slate-500 mb-5">Set which days and hours you&apos;re available to deliver this service.</p>

      <div className="space-y-2">
        {DAYS.map((day) => {
          const cfg = schedule[day]
          return (
            <div key={day} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${cfg.enabled ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}>
              <input
                type="checkbox"
                id={`day-${day}`}
                checked={cfg.enabled}
                onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <label htmlFor={`day-${day}`} className={`w-24 text-sm font-semibold ${cfg.enabled ? "text-[#2563EB]" : "text-slate-500"}`}>
                {day.slice(0, 3)}
              </label>
              {cfg.enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={cfg.start} onChange={(e) => updateDay(day, "start", e.target.value)} className="h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white" />
                  <span className="text-slate-400 text-sm">to</span>
                  <input type="time" value={cfg.end} onChange={(e) => updateDay(day, "end", e.target.value)} className="h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white" />
                </div>
              )}
              {!cfg.enabled && <span className="text-sm text-slate-400 flex-1">Unavailable</span>}
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <SupplierButton size="sm" loading={saving} onClick={() => void onPatch({ availability_schedule: schedule })}>
          Save availability
        </SupplierButton>
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 7 — Fees
══════════════════════════════════════════════════════════════════════════ */

function FeesTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const [travelFee, setTravelFee] = useState(String(l.travel_fee_pence ?? ""))
  const [weekendSurcharge, setWeekendSurcharge] = useState(String(l.weekend_surcharge_pct ?? ""))
  const [emergencyFee, setEmergencyFee] = useState(String(l.emergency_callout_fee_pence ?? ""))
  const [depositRequired, setDepositRequired] = useState(l.deposit_required)
  const [depositPct, setDepositPct] = useState(String(l.deposit_pct ?? ""))

  return (
    <SupplierCard className="p-5 max-w-xl space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Additional fees</h2>

      <SupplierField label="Travel fee (pence)" hint="Charged per visit, on top of the service price.">
        <input
          type="number"
          className={supplierInputClass}
          value={travelFee}
          onChange={(e) => setTravelFee(e.target.value)}
          onBlur={() => void onPatch({ travel_fee_pence: travelFee ? parseInt(travelFee, 10) : null })}
          min={0}
        />
      </SupplierField>

      <SupplierField label="Weekend surcharge (%)" hint="Percentage added to the base price for weekend bookings.">
        <input
          type="number"
          className={supplierInputClass}
          value={weekendSurcharge}
          onChange={(e) => setWeekendSurcharge(e.target.value)}
          onBlur={() => void onPatch({ weekend_surcharge_pct: weekendSurcharge ? parseFloat(weekendSurcharge) : null })}
          min={0}
          max={100}
          step={5}
        />
      </SupplierField>

      <SupplierField label="Emergency callout fee (pence)" hint="Applies for out-of-hours or same-day requests.">
        <input
          type="number"
          className={supplierInputClass}
          value={emergencyFee}
          onChange={(e) => setEmergencyFee(e.target.value)}
          onBlur={() => void onPatch({ emergency_callout_fee_pence: emergencyFee ? parseInt(emergencyFee, 10) : null })}
          min={0}
        />
      </SupplierField>

      <div className="border-t border-slate-100 pt-4">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Deposit</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={depositRequired}
            onChange={(e) => {
              setDepositRequired(e.target.checked)
              void onPatch({ deposit_required: e.target.checked })
            }}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <span className="text-sm text-slate-700">Require a deposit at booking</span>
        </label>
        {depositRequired && (
          <div className="mt-3">
        <SupplierField label="Deposit %">
            <input
              type="number"
              className={supplierInputClass}
              value={depositPct}
              onChange={(e) => setDepositPct(e.target.value)}
              onBlur={() => void onPatch({ deposit_pct: depositPct ? parseFloat(depositPct) : null })}
              min={0}
              max={100}
              step={5}
            />
          </SupplierField>
          </div>
        )}
      </div>

      <SupplierButton size="sm" loading={saving} onClick={() => void onPatch({
        travel_fee_pence: travelFee ? parseInt(travelFee, 10) : null,
        weekend_surcharge_pct: weekendSurcharge ? parseFloat(weekendSurcharge) : null,
        emergency_callout_fee_pence: emergencyFee ? parseInt(emergencyFee, 10) : null,
        deposit_required: depositRequired,
        deposit_pct: depositPct ? parseFloat(depositPct) : null,
      })}>
        Save fees
      </SupplierButton>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 8 — Rules
══════════════════════════════════════════════════════════════════════════ */

function RulesTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const [included, setIncluded] = useState(l.terms_included ?? "")
  const [excluded, setExcluded] = useState(l.terms_excluded ?? "")
  const [cancellation, setCancellation] = useState(l.cancellation_policy ?? "")
  const [responseTime, setResponseTime] = useState(String(l.response_time_hours ?? ""))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Terms</h2>

        <SupplierField label="What&apos;s included" hint="List everything the buyer gets in this service.">
          <textarea
            className={supplierTextareaClass}
            rows={4}
            value={included}
            onChange={(e) => setIncluded(e.target.value)}
            onBlur={() => void onPatch({ terms_included: included })}
            placeholder="e.g. Labour, materials up to £50, before/after photos…"
          />
        </SupplierField>

        <SupplierField label="What&apos;s NOT included" hint="Set expectations to avoid disputes.">
          <textarea
            className={supplierTextareaClass}
            rows={3}
            value={excluded}
            onChange={(e) => setExcluded(e.target.value)}
            onBlur={() => void onPatch({ terms_excluded: excluded })}
            placeholder="e.g. Specialist parts, scaffolding, structural work…"
          />
        </SupplierField>
      </SupplierCard>

      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Policy</h2>

        <SupplierField label="Cancellation policy" hint="What happens if the buyer cancels.">
          <select
            className={supplierInputClass}
            value={cancellation}
            onChange={(e) => {
              setCancellation(e.target.value)
              void onPatch({ cancellation_policy: e.target.value })
            }}
          >
            <option value="">Select policy…</option>
            <option value="flexible">Flexible — full refund up to 24h before</option>
            <option value="moderate">Moderate — 50% refund up to 48h before</option>
            <option value="strict">Strict — no refund after booking</option>
            <option value="custom">Custom — see description</option>
          </select>
        </SupplierField>

        <SupplierField label="Response time commitment (hours)" hint="How quickly you commit to respond to enquiries.">
          <input
            type="number"
            className={supplierInputClass}
            value={responseTime}
            onChange={(e) => setResponseTime(e.target.value)}
            onBlur={() => void onPatch({ response_time_hours: responseTime ? parseInt(responseTime, 10) : null })}
            min={1}
            max={72}
          />
          {responseTime && <p className="text-xs text-slate-400 mt-1">You commit to responding within {responseTime} hour{parseInt(responseTime, 10) === 1 ? "" : "s"}.</p>}
        </SupplierField>

        <SupplierButton size="sm" loading={saving} onClick={() => void onPatch({
          terms_included: included,
          terms_excluded: excluded,
          cancellation_policy: cancellation,
          response_time_hours: responseTime ? parseInt(responseTime, 10) : null,
        })}>
          Save rules
        </SupplierButton>
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 9 — Orders
══════════════════════════════════════════════════════════════════════════ */

function OrdersTab({ items, loading }: { items: ListingOrder[]; loading: boolean }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Orders for this listing</h2>
      {loading ? (
        <SupplierLoadingState rows={4} />
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No orders yet</p>
          <p className="text-xs text-slate-400 mt-1">Orders placed via this listing appear here once you start receiving buyers.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2 pr-4">Buyer</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2 pr-4">Status</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2 pr-4">Value</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{o.buyer_name ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    <SupplierStatusBadge tone={toneForStatus(o.status)}>{humaniseStatus(o.status)}</SupplierStatusBadge>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-slate-900">{moneyPence(o.amount_pence, o.currency)}</td>
                  <td className="py-2.5 text-right text-slate-500">{shortDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 10 — Reviews
══════════════════════════════════════════════════════════════════════════ */

function ReviewsTab({
  items, loading, listingId, workspaceId, onBanner, refresh,
}: {
  items: ListingReview[]; loading: boolean; listingId: string; workspaceId: string | null; onBanner: (m: string) => void; refresh: () => void
}) {
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const avgRating = items.length
    ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1)
    : null

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: items.filter((r) => r.rating === star).length,
  }))

  async function submitReply(reviewId: string) {
    const reply = replyDraft[reviewId]?.trim()
    if (!reply || !workspaceId) return
    const res = await fetch(`/api/marketplace/listings/${listingId}/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, reply }),
    })
    if (res.ok) {
      onBanner("Reply submitted.")
      setReplyingTo(null)
      refresh()
    } else {
      onBanner("Couldn't submit reply.")
    }
  }

  return (
    <div className="space-y-4">
      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <SupplierCard className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-slate-900">{avgRating ?? "—"}</p>
          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${avgRating && parseFloat(avgRating) >= s ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500">{items.length} review{items.length === 1 ? "" : "s"}</p>
        </SupplierCard>

        <SupplierCard className="p-5">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Rating breakdown</h3>
          <div className="space-y-2">
            {distribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 w-4">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: items.length ? `${(count / items.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-4">{count}</span>
              </div>
            ))}
          </div>
        </SupplierCard>
      </div>

      {/* Individual reviews */}
      {loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={3} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <div className="text-center py-8">
            <Star className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No reviews yet</p>
          </div>
        </SupplierCard>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <SupplierCard key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.author ?? "Anonymous"}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${r.rating >= s ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{shortDate(r.created_at)}</span>
                  </div>
                </div>
              </div>
              {r.title && <p className="text-sm font-semibold text-slate-900 mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-slate-600 mt-1">{r.body}</p>}

              {r.reply && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-[#2563EB]/20">
                  <p className="text-xs font-semibold text-[#2563EB] mb-0.5">Your reply</p>
                  <p className="text-sm text-slate-600">{r.reply}</p>
                </div>
              )}

              {!r.reply && (
                <div className="mt-3">
                  {replyingTo === r.id ? (
                    <div className="space-y-2">
                      <textarea
                        className={supplierTextareaClass}
                        rows={2}
                        placeholder="Write a public reply…"
                        value={replyDraft[r.id] ?? ""}
                        onChange={(e) => setReplyDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <div className="flex items-center gap-2">
                        <SupplierButton size="sm" onClick={() => void submitReply(r.id)}>Post reply</SupplierButton>
                        <SupplierButton size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</SupplierButton>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(r.id)}
                      className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
                    >
                      Reply to this review
                    </button>
                  )}
                </div>
              )}
            </SupplierCard>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 11 — Performance
══════════════════════════════════════════════════════════════════════════ */

function PerformanceTab({ listing: l }: { listing: ListingRow }) {
  const conversionRate = l.view_count && l.order_count
    ? ((l.order_count / l.view_count) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total views", value: l.view_count ?? 0, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Enquiries", value: l.enquiry_count ?? 0, icon: Pencil, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Orders", value: l.order_count ?? 0, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Conversion", value: conversionRate ? `${conversionRate}%` : "—", icon: BarChart2, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <SupplierCard key={label} className="p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{String(value)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </SupplierCard>
        ))}
      </div>

      <SupplierCard className="p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Performance summary</h2>
        <p className="text-sm text-slate-500">
          This listing has been viewed {l.view_count ?? 0} times and converted {conversionRate ? `at ${conversionRate}%` : "—"}.
          {l.avg_rating != null && ` Average customer rating: ${l.avg_rating.toFixed(1)} / 5.`}
        </p>
        <div className="mt-4 border border-slate-100 rounded-xl p-4 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Detailed analytics</p>
          <p className="text-sm text-slate-400">Chart views, click-throughs, and search ranking coming soon. Run <strong>AI Optimiser</strong> for improvement suggestions now.</p>
        </div>
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 12 — AI Optimiser
══════════════════════════════════════════════════════════════════════════ */

function AiOptimiserTab({
  listing: l, workspaceId, onBanner,
}: { listing: ListingRow; workspaceId: string | null; onBanner: (m: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function runOptimiser() {
    if (!workspaceId) return
    setLoading(true)
    try {
      const res = await fetch("/api/ai/listing-optimiser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: l.id, workspaceId }),
      })
      if (res.ok) {
        const j = await res.json()
        setSuggestions(Array.isArray(j.suggestions) ? (j.suggestions as string[]) : [])
      } else {
        onBanner("AI Optimiser isn't available right now.")
      }
    } catch {
      onBanner("Network error — couldn't reach AI Optimiser.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SupplierCard className="p-5">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">AI Listing Optimiser</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Get AI-powered suggestions to improve your listing title, description, and pricing based on market data and similar top-performing listings.
          </p>
        </div>
      </div>

      {suggestions.length === 0 && !loading && (
        <div className="border-2 border-dashed border-violet-100 rounded-2xl p-6 text-center mb-4">
          <Sparkles className="w-7 h-7 text-violet-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No suggestions yet</p>
          <p className="text-xs text-slate-400 mt-1">Run the optimiser to get personalised recommendations.</p>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin motion-reduce:animate-none mx-auto mb-3" />
          <p className="text-sm text-slate-500">Analysing your listing…</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="space-y-3 mb-4">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-3 bg-violet-50 rounded-xl p-3.5">
              <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{s}</p>
            </li>
          ))}
        </ul>
      )}

      <SupplierButton onClick={() => void runOptimiser()} loading={loading}>
        <Sparkles className="w-4 h-4" /> {suggestions.length > 0 ? "Re-run Optimiser" : "Run AI Optimiser"}
      </SupplierButton>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 13 — Channels
══════════════════════════════════════════════════════════════════════════ */

function ChannelsTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const publicUrl = l.slug ? `${typeof window !== "undefined" ? window.location.origin : "https://propvora.com"}/marketplace/${l.slug}` : null

  return (
    <SupplierCard className="p-5 space-y-5">
      <h2 className="text-base font-semibold text-slate-900">Distribution channels</h2>

      {/* Propvora marketplace */}
      <div className="flex items-start justify-between gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-3">
          <Store className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Propvora marketplace</p>
            <p className="text-xs text-slate-500 mt-0.5">Visible to all property managers and customers searching the marketplace.</p>
          </div>
        </div>
        <SupplierStatusBadge tone={l.status === "published" ? "emerald" : "slate"}>
          {l.status === "published" ? "Live" : humaniseStatus(l.status)}
        </SupplierStatusBadge>
      </div>

      {/* Direct link */}
      <div className="p-4 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Direct link</p>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">Share this URL directly with clients.</p>
            {publicUrl ? (
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 font-mono focus:outline-none"
                />
                <SupplierButton
                  size="sm"
                  variant="secondary"
                  onClick={() => { void navigator.clipboard.writeText(publicUrl) }}
                >
                  Copy
                </SupplierButton>
                <Link href={publicUrl} target="_blank" className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Set a slug in Settings to generate your direct link.</p>
            )}
          </div>
        </div>
      </div>

      {/* Embed widget */}
      <div className="p-4 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Share2 className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Embed widget</p>
            <p className="text-xs text-slate-500 mt-0.5">Embed this listing on your own website.</p>
            <p className="text-xs text-slate-400 mt-2">Embed widget — coming soon.</p>
          </div>
        </div>
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 14 — Settings
══════════════════════════════════════════════════════════════════════════ */

function SettingsTab({ listing: l, onPatch, saving }: { listing: ListingRow; onPatch: (f: Record<string, unknown>) => Promise<void>; saving: boolean }) {
  const [slug, setSlug] = useState(l.slug ?? "")
  const [seoTitle, setSeoTitle] = useState(l.seo_title ?? "")
  const [seoDesc, setSeoDesc] = useState(l.seo_description ?? "")
  const [visibility, setVisibility] = useState(l.visibility ?? "public")
  const [featured, setFeatured] = useState(l.is_featured)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">URL &amp; visibility</h2>

        <SupplierField label="Listing slug" hint="Becomes your /marketplace/{slug} URL. Lowercase, hyphens only.">
          <input
            className={supplierInputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            onBlur={() => void onPatch({ slug: slug || null })}
            placeholder="e.g. residential-cleaning-london"
          />
        </SupplierField>

        <SupplierField label="Visibility">
          <select
            className={supplierInputClass}
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value)
              void onPatch({ visibility: e.target.value })
            }}
          >
            <option value="public">Public — anyone can find it</option>
            <option value="unlisted">Unlisted — only via direct link</option>
            <option value="private">Private — not visible</option>
          </select>
        </SupplierField>

        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => {
              setFeatured(e.target.checked)
              void onPatch({ is_featured: e.target.checked })
            }}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <span className="text-sm text-slate-700">Request featured placement</span>
        </label>
      </SupplierCard>

      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">SEO meta</h2>

        <SupplierField label="SEO title" hint="Custom title shown in search engines (max 60 chars).">
          <input
            className={supplierInputClass}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            onBlur={() => void onPatch({ seo_title: seoTitle || null })}
            maxLength={60}
            placeholder="e.g. Professional Residential Cleaning | London"
          />
          <span className="text-[11px] text-slate-400">{seoTitle.length}/60</span>
        </SupplierField>

        <SupplierField label="SEO description" hint="Summary shown in search results (max 160 chars).">
          <textarea
            className={supplierTextareaClass}
            rows={3}
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            onBlur={() => void onPatch({ seo_description: seoDesc || null })}
            maxLength={160}
            placeholder="e.g. Book a professional residential clean in London from £80…"
          />
          <span className="text-[11px] text-slate-400">{seoDesc.length}/160</span>
        </SupplierField>

        <SupplierButton size="sm" loading={saving} onClick={() => void onPatch({ slug: slug || null, seo_title: seoTitle || null, seo_description: seoDesc || null, visibility, is_featured: featured })}>
          Save settings
        </SupplierButton>
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 15 — Activity
══════════════════════════════════════════════════════════════════════════ */

function ActivityTab({ items, loading }: { items: ListingAuditEntry[]; loading: boolean }) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Audit log</h2>
      </div>
      {loading ? (
        <SupplierLoadingState rows={4} />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((e, i) => (
            <li key={e.id ?? i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mt-1.5" />
                {i < items.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-semibold text-slate-800">{humaniseStatus(e.action)}</p>
                {e.field && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{e.field}</span>
                    {e.old_value != null && <> changed from <span className="font-mono text-slate-600">{e.old_value}</span></>}
                    {e.new_value != null && <> to <span className="font-mono text-slate-600">{e.new_value}</span></>}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SupplierCard>
  )
}

/* ── Small helpers ────────────────────────────────────────────────────────── */

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{value}</dd>
    </div>
  )
}
