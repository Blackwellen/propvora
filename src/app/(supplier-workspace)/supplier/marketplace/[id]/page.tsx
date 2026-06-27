"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { moneyPence, fmtDate, humaniseStatus } from "@/components/supplier-workspace/format"
import {
  SupplierStatusBadge,
  SupplierButton,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierCard,
  SupplierCardHeader,
  SupplierBanner,
  SupplierField,
  supplierInputClass,
  supplierTextareaClass,
  SupplierDrawer,
} from "@/components/supplier-workspace/ui"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  ShoppingBag,
  Images,
  MapPin,
  DollarSign,
  Settings,
  AlignLeft,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  workspace_id: string
  title: string
  description: string | null
  category: string | null
  transaction_type: string
  status: string
  base_price_pence: number | null
  pricing_model: string | null
  currency: string
  location: string | null
  country_code: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface Media {
  id: string
  url: string
  kind: string
  sort_order: number
}

interface PricingRule {
  id: string
  rule_type: string
  amount_pence: number
  min_nights: number | null
  conditions: unknown
}

interface CoverageArea {
  id: string
  label: string
  postcode: string | null
  city: string | null
  region: string | null
  radius_miles: number | null
  emergency: boolean | null
}

interface Transaction {
  id: string
  buyer_workspace_id: string
  gross_pence: number
  platform_fee_pence: number
  seller_payout_pence: number
  status: string
  currency: string
  created_at: string
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Overview",  icon: AlignLeft },
  { id: "pricing",   label: "Pricing",   icon: DollarSign },
  { id: "coverage",  label: "Coverage",  icon: MapPin },
  { id: "media",     label: "Media",     icon: Images },
  { id: "orders",    label: "Orders",    icon: ShoppingBag },
  { id: "reviews",   label: "Reviews",   icon: Star },
  { id: "settings",  label: "Settings",  icon: Settings },
]

// ─── Sub-tab panels ───────────────────────────────────────────────────────────

// Overview tab
function OverviewTab({ listing, onSave }: { listing: Listing; onSave: (patch: Partial<Listing>) => Promise<void> }) {
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description ?? "")
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ title, description })
      setBanner({ tone: "emerald", msg: "Saved successfully" })
    } catch {
      setBanner({ tone: "red", msg: "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {banner && <SupplierBanner tone={banner.tone} msg={banner.msg} />}

      <SupplierCard className="p-5 space-y-4">
        <SupplierField label="Title">
          <input
            className={supplierInputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </SupplierField>
        <SupplierField label="Description">
          <textarea
            className={cn(supplierTextareaClass, "min-h-[100px]")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </SupplierField>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Category</span>
            <p className="font-medium text-slate-900 mt-0.5">{listing.category ?? "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Type</span>
            <p className="font-medium text-slate-900 mt-0.5">{humaniseStatus(listing.transaction_type)}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <div className="mt-1"><SupplierStatusBadge status={listing.status} /></div>
          </div>
          <div>
            <span className="text-slate-500">Published</span>
            <p className="font-medium text-slate-900 mt-0.5">{fmtDate(listing.published_at)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <SupplierButton onClick={handleSave} loading={saving}>Save changes</SupplierButton>
        </div>
      </SupplierCard>
    </div>
  )
}

// Pricing tab
function PricingTab({
  listing,
  rules,
  onAddRule,
  onDeleteRule,
  onSaveListing,
}: {
  listing: Listing
  rules: PricingRule[]
  onAddRule: (rule: Omit<PricingRule, "id">) => Promise<void>
  onDeleteRule: (id: string) => Promise<void>
  onSaveListing: (patch: Partial<Listing>) => Promise<void>
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [ruleType, setRuleType] = useState("fixed")
  const [amountPounds, setAmountPounds] = useState("")
  const [minNights, setMinNights] = useState("")
  const [saving, setSaving] = useState(false)
  const [basePrice, setBasePrice] = useState(
    listing.base_price_pence !== null ? (listing.base_price_pence / 100).toFixed(2) : ""
  )
  const [pricingModel, setPricingModel] = useState(listing.pricing_model ?? "fixed")
  const [baseSaved, setBaseSaved] = useState<boolean | null>(null)

  async function handleAddRule() {
    setSaving(true)
    try {
      await onAddRule({
        rule_type: ruleType,
        amount_pence: Math.round(parseFloat(amountPounds) * 100),
        min_nights: minNights ? parseInt(minNights) : null,
        conditions: null,
      })
      setDrawerOpen(false)
      setAmountPounds("")
      setMinNights("")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBase() {
    setSaving(true)
    try {
      await onSaveListing({
        base_price_pence: Math.round(parseFloat(basePrice) * 100),
        pricing_model: pricingModel,
      })
      setBaseSaved(true)
    } catch {
      setBaseSaved(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SupplierCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Base Pricing</h3>
        {baseSaved === true && <SupplierBanner tone="emerald" msg="Base price saved" />}
        {baseSaved === false && <SupplierBanner tone="red" msg="Failed to save" />}
        <div className="grid grid-cols-2 gap-4">
          <SupplierField label="Base Price (£)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={supplierInputClass}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </SupplierField>
          <SupplierField label="Pricing Model">
            <select
              className={supplierInputClass}
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
            >
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="quote_required">Quote required</option>
              <option value="per_unit">Per unit</option>
            </select>
          </SupplierField>
        </div>
        <div className="flex justify-end">
          <SupplierButton onClick={handleSaveBase} loading={saving} size="sm">Save base price</SupplierButton>
        </div>
      </SupplierCard>

      <SupplierCard>
        <SupplierCardHeader
          title="Price Tiers"
          action={
            <SupplierButton size="sm" onClick={() => setDrawerOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add tier
            </SupplierButton>
          }
        />
        {rules.length === 0 ? (
          <SupplierEmptyState title="No price tiers" description="Add tiers for seasonal or quantity pricing." />
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{humaniseStatus(r.rule_type)}</p>
                  <p className="text-xs text-slate-400">
                    {moneyPence(r.amount_pence, listing.currency)}
                    {r.min_nights ? ` · min ${r.min_nights} nights` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteRule(r.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SupplierCard>

      <SupplierDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Price Tier">
        <div className="space-y-4">
          <SupplierField label="Rule type">
            <select className={supplierInputClass} value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
              <option value="fixed">Fixed</option>
              <option value="seasonal">Seasonal</option>
              <option value="bulk">Bulk</option>
              <option value="long_stay">Long stay</option>
            </select>
          </SupplierField>
          <SupplierField label="Amount (£)">
            <input type="number" min="0" step="0.01" className={supplierInputClass} value={amountPounds} onChange={(e) => setAmountPounds(e.target.value)} />
          </SupplierField>
          <SupplierField label="Min nights (optional)">
            <input type="number" min="0" className={supplierInputClass} value={minNights} onChange={(e) => setMinNights(e.target.value)} />
          </SupplierField>
          <SupplierButton onClick={handleAddRule} loading={saving} className="w-full">Add tier</SupplierButton>
        </div>
      </SupplierDrawer>
    </div>
  )
}

// Coverage tab
function CoverageTab({ areas }: { areas: CoverageArea[] }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-slate-500">
        Coverage areas are shared across all your listings.{" "}
        <Link href="/supplier/coverage" className="text-[var(--brand)] hover:underline">
          Manage coverage areas →
        </Link>
      </p>
      {areas.length === 0 ? (
        <SupplierEmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="No coverage areas"
          description="Add coverage areas to help buyers find your services."
          action={
            <Link href="/supplier/coverage">
              <SupplierButton>Add coverage areas</SupplierButton>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {a.label}
              {a.emergency && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded-full">
                  24/7
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Media tab
function MediaTab({
  listingId,
  media,
  onDelete,
  onUpload,
}: {
  listingId: string
  media: Media[]
  onDelete: (id: string) => Promise<void>
  onUpload: (file: File) => Promise<void>
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Note: Images are stored as data URLs. For production R2 storage, use the R2 upload API.
      </p>
      <label className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 cursor-pointer hover:border-[var(--color-brand-300)] hover:text-[var(--brand)] transition-colors",
        uploading && "opacity-50 cursor-wait"
      )}>
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
        {uploading ? "Uploading…" : "+ Upload image"}
      </label>
      {media.length === 0 ? (
        <SupplierEmptyState
          icon={<Images className="w-10 h-10" />}
          title="No media yet"
          description="Upload images to showcase your listing."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((m) => (
            <div key={m.id} className="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onDelete(m.id)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Orders tab
function OrdersTab({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <SupplierEmptyState
        icon={<ShoppingBag className="w-10 h-10" />}
        title="No orders yet"
        description="Orders from buyers will appear here once your listing is published."
      />
    )
  }
  return (
    <SupplierCard>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Payout</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-3 text-slate-600">{fmtDate(t.created_at)}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{moneyPence(t.gross_pence, t.currency)}</td>
                <td className="px-5 py-3 text-slate-600">{moneyPence(t.seller_payout_pence, t.currency)}</td>
                <td className="px-5 py-3"><SupplierStatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SupplierCard>
  )
}

// Reviews tab
function ReviewsTab() {
  return (
    <SupplierEmptyState
      icon={<Star className="w-10 h-10" />}
      title="No reviews yet"
      description="Reviews from buyers will appear here once jobs are completed through this listing."
    />
  )
}

// Settings tab
function SettingsTab({
  listing,
  onStatusChange,
  onDelete,
}: {
  listing: Listing
  onStatusChange: (status: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(listing.status)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const STATUSES = ["draft", "pending_review", "published", "paused", "archived"]

  async function handleStatusSave() {
    setSaving(true)
    try {
      await onStatusChange(pendingStatus)
      setBanner({ tone: "emerald", msg: "Status updated" })
    } catch {
      setBanner({ tone: "red", msg: "Failed to update status" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently? This cannot be undone.")) return
    await onDelete()
  }

  return (
    <div className="space-y-6 max-w-lg">
      {banner && <SupplierBanner tone={banner.tone} msg={banner.msg} />}

      <SupplierCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
        <SupplierField label="Change status">
          <select
            className={supplierInputClass}
            value={pendingStatus}
            onChange={(e) => setPendingStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{humaniseStatus(s)}</option>
            ))}
          </select>
        </SupplierField>
        <SupplierButton onClick={handleStatusSave} loading={saving} size="sm">
          Update status
        </SupplierButton>
      </SupplierCard>

      <SupplierCard className="p-5 space-y-3 border-red-100">
        <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
        <p className="text-sm text-slate-500">Deleting this listing is permanent and cannot be undone.</p>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete listing
        </button>
      </SupplierCard>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params?.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      // Get user workspace
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      const wsId = member?.workspace_id ?? null
      setWorkspaceId(wsId)

      // Load listing
      const { data: l, error: lErr } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", listingId)
        .single()
      if (lErr) throw lErr
      setListing(l as Listing)

      // Load media
      const { data: m } = await supabase
        .from("marketplace_listing_media")
        .select("id, url, kind, sort_order")
        .eq("listing_id", listingId)
        .order("sort_order")
      setMedia((m ?? []) as Media[])

      // Load pricing rules
      const { data: pr } = await supabase
        .from("marketplace_listing_pricing")
        .select("id, rule_type, amount_pence, min_nights, conditions")
        .eq("listing_id", listingId)
      setPricingRules((pr ?? []) as PricingRule[])

      // Load coverage areas
      if (wsId) {
        const { data: ca } = await supabase
          .from("coverage_areas")
          .select("id, label, postcode, city, region, radius_miles, emergency")
          .eq("workspace_id", wsId)
        setCoverageAreas((ca ?? []) as CoverageArea[])
      }

      // Load transactions
      const { data: tx } = await supabase
        .from("marketplace_transactions")
        .select("id, buyer_workspace_id, gross_pence, platform_fee_pence, seller_payout_pence, status, currency, created_at")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
      setTransactions((tx ?? []) as Transaction[])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing")
    } finally {
      setLoading(false)
    }
  }, [listingId, router])

  useEffect(() => { loadData() }, [loadData])

  async function handleSaveListing(patch: Partial<Listing>) {
    const supabase = createClient()
    const { error } = await supabase
      .from("marketplace_listings")
      .update(patch)
      .eq("id", listingId)
    if (error) throw error
    setListing((prev) => prev ? { ...prev, ...patch } : prev)
  }

  async function handleAddPricingRule(rule: Omit<PricingRule, "id">) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("marketplace_listing_pricing")
      .insert({ ...rule, listing_id: listingId })
      .select()
      .single()
    if (error) throw error
    setPricingRules((prev) => [...prev, data as PricingRule])
  }

  async function handleDeletePricingRule(id: string) {
    const supabase = createClient()
    await supabase.from("marketplace_listing_pricing").delete().eq("id", id)
    setPricingRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleUploadMedia(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const supabase = createClient()
    const { data, error } = await supabase
      .from("marketplace_listing_media")
      .insert({
        listing_id: listingId,
        url: dataUrl,
        kind: "image",
        sort_order: media.length,
        r2_key: "",
      })
      .select()
      .single()
    if (error) throw error
    setMedia((prev) => [...prev, data as Media])
  }

  async function handleDeleteMedia(id: string) {
    const supabase = createClient()
    await supabase.from("marketplace_listing_media").delete().eq("id", id)
    setMedia((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleStatusChange(status: string) {
    await handleSaveListing({ status })
  }

  async function handleDeleteListing() {
    const supabase = createClient()
    await supabase.from("marketplace_listings").delete().eq("id", listingId)
    router.push("/supplier/marketplace")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-slate-100 rounded w-48 mb-6 animate-pulse" />
        <SupplierLoadingState rows={4} />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto">
        <SupplierBanner tone="red" msg={error ?? "Listing not found"} />
        <div className="mt-4">
          <Link href="/supplier/marketplace">
            <SupplierButton variant="outline"><ArrowLeft className="w-4 h-4" /> Back</SupplierButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/supplier/marketplace" className="mt-1">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 truncate">{listing.title}</h1>
            <SupplierStatusBadge status={listing.status} />
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {listing.category ? `${listing.category} · ` : ""}
            {humaniseStatus(listing.transaction_type)}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-slate-200 mb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab listing={listing} onSave={handleSaveListing} />
      )}
      {activeTab === "pricing" && (
        <PricingTab
          listing={listing}
          rules={pricingRules}
          onAddRule={handleAddPricingRule}
          onDeleteRule={handleDeletePricingRule}
          onSaveListing={handleSaveListing}
        />
      )}
      {activeTab === "coverage" && (
        <CoverageTab areas={coverageAreas} />
      )}
      {activeTab === "media" && (
        <MediaTab
          listingId={listingId}
          media={media}
          onDelete={handleDeleteMedia}
          onUpload={handleUploadMedia}
        />
      )}
      {activeTab === "orders" && (
        <OrdersTab transactions={transactions} />
      )}
      {activeTab === "reviews" && <ReviewsTab />}
      {activeTab === "settings" && (
        <SettingsTab
          listing={listing}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteListing}
        />
      )}
    </div>
  )
}
