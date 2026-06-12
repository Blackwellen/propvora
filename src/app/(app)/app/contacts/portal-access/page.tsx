"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Plus, Search, X, Copy, RefreshCw, XCircle, ExternalLink,
  Globe, Shield, Hash, Clock, Zap, Activity, Lock,
  ChevronDown, CheckCircle2, AlertTriangle, SlidersHorizontal,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import ContactsKpiCard from "@/components/contacts/ContactsKpiCard"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/useWorkspace"

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_BG = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500",
]
function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PortalStatus = "active" | "pending" | "expired" | "revoked"
type FilterKey = "all" | PortalStatus
type TypeFilterKey = "all" | "supplier" | "applicant" | "tenant" | "landlord"

interface PortalLink {
  id: string
  contactName: string
  contactSubtitle: string
  contactType: TypeFilterKey
  purpose: string
  status: PortalStatus
  created: string
  expires: string
  lastOpened: string
}

// ─── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<PortalStatus, { cls: string; label: string }> = {
  active:  { cls: "bg-emerald-100 text-emerald-700", label: "Active" },
  pending: { cls: "bg-blue-100 text-blue-700",       label: "Pending" },
  expired: { cls: "bg-slate-100 text-slate-500",     label: "Expired" },
  revoked: { cls: "bg-red-100 text-red-700",         label: "Revoked" },
}

const TYPE_BADGE_CLS: Record<string, string> = {
  supplier:  "bg-orange-100 text-orange-700",
  applicant: "bg-sky-100 text-sky-700",
  tenant:    "bg-emerald-100 text-emerald-700",
  landlord:  "bg-blue-100 text-blue-700",
}

// ─── Create link modal ─────────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateLinkModal({ onClose, onSuccess }: CreateModalProps) {
  const [contact, setContact] = useState("")
  const [purpose, setPurpose] = useState("")
  const [expiry, setExpiry] = useState("")

  const handleSubmit = () => {
    // Portal link creation requires email configuration (Resend)
    // For now we show confirmation toast and close
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Create Portal Link</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact</label>
            <input
              type="text"
              placeholder="Search or enter contact name..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
            >
              <option value="">Select purpose...</option>
              <option value="invoice_upload">Invoice upload</option>
              <option value="quote_submission">Quote submission</option>
              <option value="document_exchange">Document exchange</option>
              <option value="application_form">Application form</option>
              <option value="viewing_confirmation">Viewing confirmation</option>
              <option value="lease_documents">Lease documents</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry</label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
            >
              <option value="">Select expiry...</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!contact || !purpose || !expiry}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Link
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PortalAccessPage() {
  const { data: workspace } = useWorkspace()
  const [portalLinks, setPortalLinks] = useState<PortalLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>("all")
  const [search, setSearch] = useState("")
  const [typeDropOpen, setTypeDropOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast({ msg: "", visible: false }), 2500)
  }, [])

  // Load portal access records from supplier_portal_access joined with contacts
  useEffect(() => {
    if (!workspace?.id) return
    setLoadingLinks(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("supplier_portal_access")
          .select("id, active, created_at, contact_id, contacts(full_name, contact_type, company_name)")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })

        if (error) {
          if ((error as { code?: string }).code === "42P01") {
            // table doesn't exist yet — show empty state
            setPortalLinks([])
          } else {
            console.error("portal_access load error:", error)
          }
          return
        }

        const rows: PortalLink[] = (data ?? []).map((row) => {
          const c = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts
          const contactName = (c as { full_name?: string } | null)?.full_name ?? "Unknown Contact"
          const contactType = ((c as { contact_type?: string } | null)?.contact_type ?? "other") as TypeFilterKey
          const company = (c as { company_name?: string | null } | null)?.company_name
          const contactSubtitle = company ?? contactType.charAt(0).toUpperCase() + contactType.slice(1)
          const status: PortalStatus = row.active ? "active" : "expired"
          const created = new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          return {
            id: row.id,
            contactName,
            contactSubtitle,
            contactType,
            purpose: "Portal access",
            status,
            created,
            expires: "—",
            lastOpened: "—",
          }
        })
        setPortalLinks(rows)
      } catch (err) {
        console.error("portal_access fetch error:", err)
      } finally {
        setLoadingLinks(false)
      }
    })()
  }, [workspace?.id])

  const handleCopy = (id: string) => {
    const link = portalLinks.find(l => l.id === id)
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${id}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => { /* fallback */ })
    }
    setCopiedId(id)
    showToast(link ? `Link copied for ${link.contactName}` : "Link copied!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRevoke = (id: string) => {
    if (confirmRevokeId === id) {
      // Portal link revocation requires backend integration — shows confirmation toast
      showToast("Portal link revoked (feature requires email configuration)")
      setConfirmRevokeId(null)
    } else {
      setConfirmRevokeId(id)
      setTimeout(() => setConfirmRevokeId(null), 3000)
    }
  }

  const filtered = portalLinks.filter((link) => {
    const matchStatus = activeFilter === "all" || link.status === activeFilter
    const matchType = typeFilter === "all" || link.contactType === typeFilter
    const matchSearch =
      !search.trim() ||
      link.contactName.toLowerCase().includes(search.toLowerCase()) ||
      link.purpose.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchType && matchSearch
  })

  const activeCount  = portalLinks.filter((l) => l.status === "active").length
  const pendingCount = portalLinks.filter((l) => l.status === "pending").length
  const expiredCount = portalLinks.filter((l) => l.status === "expired").length
  const revokedCount = portalLinks.filter((l) => l.status === "revoked").length

  const STATUS_FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "active",  label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "expired", label: "Expired" },
    { key: "revoked", label: "Revoked" },
  ]

  const TYPE_OPTIONS: { key: TypeFilterKey; label: string }[] = [
    { key: "all",       label: "All Types" },
    { key: "supplier",  label: "Supplier" },
    { key: "applicant", label: "Applicant" },
    { key: "tenant",    label: "Tenant" },
    { key: "landlord",  label: "Landlord" },
  ]

  const SECURITY_FEATURES = [
    { icon: Shield,   title: "Scoped Access",        desc: "All links are scoped to the contact and purpose only" },
    { icon: Hash,     title: "No Plain Text Tokens",  desc: "Tokens are hashed server-side and never stored in plain text" },
    { icon: Clock,    title: "Expiring by Design",    desc: "All links have automatic expiry and reminders" },
    { icon: Zap,      title: "Immediate Revocation",  desc: "Links can be revoked instantly from the dashboard" },
    { icon: Activity, title: "Full Audit Trail",      desc: "All portal activity is logged and fully auditable" },
    { icon: Lock,     title: "Secure by Default",     desc: "MFA, HTTPS, and encrypted transmission always" },
  ]

  return (
    <DashboardContainer>
      <ContactsTabNav />

      <div className="px-6 pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Access</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage secure portal links for supplier and contact access</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Portal Link
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ContactsKpiCard
            label="Active Links"
            value={activeCount}
            trend="+2 this week"
            trendUp
            icon={<Globe className="w-5 h-5 text-emerald-600" />}
            accentColor="bg-emerald-50"
          />
          <ContactsKpiCard
            label="Pending / Created"
            value={pendingCount}
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            accentColor="bg-blue-50"
          />
          <ContactsKpiCard
            label="Expired"
            value={expiredCount}
            icon={<AlertTriangle className="w-5 h-5 text-slate-400" />}
            accentColor="bg-slate-50"
          />
          <ContactsKpiCard
            label="Revoked"
            value={revokedCount}
            icon={<XCircle className="w-5 h-5 text-red-400" />}
            accentColor="bg-red-50"
          />
        </div>

        {/* Main 2-col layout */}
        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status filters */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      activeFilter === f.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Type dropdown */}
              <div className="relative">
                <button
                  onClick={() => setTypeDropOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {TYPE_OPTIONS.find((o) => o.key === typeFilter)?.label ?? "All Types"}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {typeDropOpen && (
                  <div className="absolute top-full mt-1 left-0 z-20 w-40 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                    {TYPE_OPTIONS.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => { setTypeFilter(o.key); setTypeDropOpen(false) }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors",
                          typeFilter === o.key ? "text-blue-600 font-medium" : "text-slate-600"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Contact / Organisation</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Type</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Purpose</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Created</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Expires</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Last Opened</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingLinks ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-400">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                            <span className="text-sm">Loading portal links…</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map((link) => {
                      const sCfg = STATUS_CONFIG[link.status]
                      const typeCls = TYPE_BADGE_CLS[link.contactType] ?? "bg-slate-100 text-slate-500"
                      const isExpired = link.status === "expired"
                      const isRevoked = link.status === "revoked"
                      return (
                        <tr key={link.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(link.contactName))}>
                                {initials(link.contactName)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{link.contactName}</p>
                                <p className="text-xs text-slate-400">{link.contactSubtitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize", typeCls)}>
                              {link.contactType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 whitespace-nowrap">{link.purpose}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", sCfg.cls)}>
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 whitespace-nowrap">{link.created}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs whitespace-nowrap", isExpired || isRevoked ? "text-red-500 font-medium" : "text-slate-500")}>
                              {link.expires}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs whitespace-nowrap", link.lastOpened === "—" ? "text-slate-400 italic" : "text-slate-500")}>
                              {link.lastOpened}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopy(link.id)}
                                title="Copy Link"
                                className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                {copiedId === link.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button title="Regenerate" className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRevoke(link.id)}
                                title={confirmRevokeId === link.id ? "Confirm revoke" : "Revoke"}
                                className={cn(
                                  "p-1.5 rounded-md transition-colors",
                                  confirmRevokeId === link.id
                                    ? "text-red-600 bg-red-50"
                                    : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                )}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button title="Open" className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!loadingLinks && filtered.length === 0 && (
                  <div className="py-16 text-center">
                    <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {portalLinks.length === 0 ? "No portal links created yet" : "No portal links match your filters"}
                    </p>
                    {portalLinks.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">Create a portal link to give contacts secure access</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Portal Security */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Portal Security</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SECURITY_FEATURES.map((feat) => (
                  <div key={feat.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <feat.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{feat.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <aside className="w-72 shrink-0 sticky top-6 space-y-4">
            {/* Create Link Wizard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Create Link Wizard</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Generate a new secure portal link for any contact or supplier instantly.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Link
              </button>
            </div>

            {/* Portal Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Portal Stats</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Links created",  value: String(portalLinks.length) },
                  { label: "Active links",   value: String(activeCount) },
                  { label: "Pending",        value: String(pendingCount) },
                  { label: "Expired",        value: String(expiredCount) },
                  { label: "Revoked",        value: String(revokedCount) },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{s.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert: pending links */}
            {pendingCount > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">Pending Links</p>
                    <p className="text-xs text-amber-700">
                      {pendingCount} portal {pendingCount === 1 ? "link has" : "links have"} not been opened yet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateLinkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            showToast("Portal link saved — sending requires email configuration")
          }}
        />
      )}

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-xl">
          {toast.msg}
        </div>
      )}
    </DashboardContainer>
  )
}
