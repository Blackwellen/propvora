"use client"

import { useState, useCallback, useEffect } from "react"
import {
  FileText, Upload, Send, Search, Eye, Download,
  AlertTriangle, X,
  Clock, CheckCircle, Archive, Image as ImageIcon,
  Table as TableIcon, AlertCircle,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar, MobilePageHeader, ResponsiveTable } from "@/components/mobile"
import ContactsKpiCard from "@/components/contacts/ContactsKpiCard"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { useWorkspace } from "@/hooks/useWorkspace"

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_BG = [
  "bg-[var(--brand)]","bg-emerald-500","bg-violet-500","bg-amber-500",
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
type DocStatus = "verified" | "needs_review" | "expiring" | "missing" | "expired"
type FileType = "pdf" | "img" | "sheet" | "doc" | "zip"

interface LiveDocument {
  id: string
  name: string
  ref: string
  fileType: FileType
  contactName: string
  contactRole: string
  category: string
  uploaded: string
  expiry: string | null
  daysLeft?: string
  status: DocStatus
  size: string
  url: string | null
}

// ─── Mime type → FileType ──────────────────────────────────────────────────────
function mimeToFileType(mime: string | null): FileType {
  if (!mime) return "doc"
  if (mime.includes("pdf"))  return "pdf"
  if (mime.includes("image")) return "img"
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "sheet"
  if (mime.includes("zip") || mime.includes("compressed")) return "zip"
  return "doc"
}

// ─── Format file size ──────────────────────────────────────────────────────────
function fmtSize(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORIES = [
  "All",
  "Tenancy Agreements",
  "Identity Documents",
  "Insurance",
  "Compliance",
  "Supplier Certifications",
  "Landlord Agreements",
  "Other",
]

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DocStatus, { label: string; cls: string }> = {
  verified:     { label: "Verified ✓",    cls: "bg-emerald-100 text-emerald-700" },
  needs_review: { label: "Needs Review",  cls: "bg-amber-100 text-amber-700" },
  expiring:     { label: "Expiring Soon", cls: "bg-orange-100 text-orange-700" },
  missing:      { label: "Missing",       cls: "bg-red-100 text-red-700" },
  expired:      { label: "Expired",       cls: "bg-slate-100 text-slate-500" },
}

// ─── File type icon ────────────────────────────────────────────────────────────
function FileTypeIcon({ type }: { type: FileType }) {
  const config: Record<FileType, { icon: React.ElementType; cls: string; bg: string }> = {
    pdf:   { icon: FileText,   cls: "text-red-500",     bg: "bg-red-100" },
    img:   { icon: ImageIcon,  cls: "text-green-500",   bg: "bg-green-100" },
    sheet: { icon: TableIcon,  cls: "text-emerald-600", bg: "bg-emerald-100" },
    doc:   { icon: FileText,   cls: "text-[var(--brand)]",    bg: "bg-[var(--color-brand-100)]" },
    zip:   { icon: Archive,    cls: "text-slate-500",   bg: "bg-slate-100" },
  }
  const { icon: Icon, cls, bg } = config[type]
  return (
    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
      <Icon className={cn("w-4.5 h-4.5", cls)} style={{ width: "18px", height: "18px" }} />
    </div>
  )
}

// ─── Upload modal ──────────────────────────────────────────────────────────────
function UploadModal({ workspaceId, contacts, onClose, onSuccess }: {
  workspaceId: string | undefined
  contacts: { id: string; display_name: string }[]
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [contact, setContact] = useState("")
  const [category, setCategory] = useState("")
  const [expiry, setExpiry] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileName = file?.name ?? ""

  async function handleSubmit() {
    if (!workspaceId) { setError("Workspace not loaded"); return }
    if (!file) { setError("Please choose a file to upload"); return }
    setSaving(true)
    setError(null)
    try {
      const uploaded = await uploadFile(file, workspaceId, "contacts")
      const supabase = createClient()
      const { error: e } = await supabase.from("documents").insert({
        workspace_id: workspaceId,
        name: file.name,
        category: category || null,
        mime_type: uploaded.type || file.type || null,
        size_bytes: uploaded.size ?? file.size,
        r2_key: uploaded.key,
        r2_bucket: "propvora",
        url: uploaded.url,
        status: "uploaded",
        expires_at: expiry || null,
        metadata: contact ? { contact_id: contact } : {},
      })
      if (e) {
        setError((e as { code?: string }).code === "42P01" ? "Documents table not provisioned yet." : e.message)
        setSaving(false)
        return
      }
      onSuccess("Document uploaded")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="upload-doc-title" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 id="upload-doc-title" className="text-base font-bold text-slate-900">Upload Document</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"><X className="w-5 h-5" /></button>
        </div>

        {/* File drop zone */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center mb-4 hover:border-[var(--color-brand-400)] transition-colors">
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Click to upload or drag & drop</p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, JPG, ZIP up to 50MB</p>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--brand)] border border-[var(--color-brand-100)] rounded-lg hover:bg-[var(--brand-soft)] cursor-pointer transition-colors">
            Browse files
          </label>
          {fileName && <p className="text-xs text-emerald-600 mt-2 font-medium">{fileName}</p>}
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="upload-doc-contact" className="block text-xs font-semibold text-slate-700 mb-1.5">Contact (optional)</label>
            <select id="upload-doc-contact" value={contact} onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all">
              <option value="">No linked contact</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="upload-doc-category" className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select id="upload-doc-category" value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all">
              <option value="">Select category...</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="upload-doc-expiry" className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry date (optional)</label>
            <input id="upload-doc-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all" />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !file} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--brand)] rounded-lg hover:bg-[var(--brand-strong)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Upload className="w-4 h-4" />{saving ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Request modal ─────────────────────────────────────────────────────────────
function RequestModal({ workspaceId, contacts, onClose, onSuccess }: {
  workspaceId: string | undefined
  contacts: { id: string; display_name: string }[]
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [contact, setContact] = useState("")
  const [docType, setDocType] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!workspaceId) { setError("Workspace not loaded"); return }
    if (!contact || !docType) { setError("Choose a contact and document type"); return }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      // A document request is recorded as a contact_activity entry (no Resend yet).
      const { error: e } = await supabase.from("contact_activity").insert({
        workspace_id: workspaceId,
        contact_id: contact,
        activity_type: "document_request",
        title: `Document requested: ${docType.replace(/_/g, " ")}`,
        description: dueDate ? `Due by ${dueDate}` : null,
        metadata: { doc_type: docType, due_date: dueDate || null },
      })
      if (e) {
        setError((e as { code?: string }).code === "42P01" ? "Activity table not provisioned yet." : e.message)
        setSaving(false)
        return
      }
      onSuccess("Document request logged")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log request")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="request-doc-title" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 id="request-doc-title" className="text-base font-bold text-slate-900">Request Document</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="request-doc-contact" className="block text-xs font-semibold text-slate-700 mb-1.5">Contact</label>
            <select id="request-doc-contact" value={contact} onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all">
              <option value="">Select a contact…</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="request-doc-type" className="block text-xs font-semibold text-slate-700 mb-1.5">Document type</label>
            <select id="request-doc-type" value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all">
              <option value="">Select document type...</option>
              <option value="id">Photo ID / Passport</option>
              <option value="tenancy">Tenancy Agreement</option>
              <option value="insurance">Insurance Certificate</option>
              <option value="gas_safe">Gas Safety Certificate</option>
              <option value="right_to_rent">Right to Rent Check</option>
              <option value="management">Management Agreement</option>
            </select>
          </div>
          <div>
            <label htmlFor="request-doc-due" className="block text-xs font-semibold text-slate-700 mb-1.5">Due date</label>
            <input id="request-doc-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all" />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--brand)] rounded-lg hover:bg-[var(--brand-strong)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />{saving ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { data: workspace } = useWorkspace()
  const [docs, setDocs] = useState<LiveDocument[]>([])
  const [contactOptions, setContactOptions] = useState<{ id: string; display_name: string }[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast({ msg: "", visible: false }), 2500)
  }, [])

  // Preview opens the authed /api/files/{key} view URL in a new tab.
  const handlePreview = useCallback((doc: LiveDocument) => {
    if (!doc.url) { showToast("File reference unavailable"); return }
    if (typeof window !== "undefined") window.open(doc.url, "_blank", "noopener,noreferrer")
  }, [showToast])

  // Download triggers a same-origin authed download with the original filename.
  const handleDownload = useCallback((doc: LiveDocument) => {
    if (!doc.url) { showToast("File reference unavailable"); return }
    if (typeof document === "undefined") return
    const a = document.createElement("a")
    a.href = doc.url
    a.download = doc.name
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [showToast])

  const loadDocs = useCallback(async () => {
    if (!workspace?.id) return
    setLoadingDocs(true)
    try {
      const supabase = createClient()
      // Live `documents` columns: name, r2_key, size_bytes, mime_type, category,
      // status, expires_at, created_at. Contact linkage is held in metadata.contact_id
      // (no contact_id column), so we resolve names client-side.
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, r2_key, url, size_bytes, mime_type, category, status, expires_at, created_at, metadata")
        .eq("workspace_id", workspace.id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) {
        // 42P01 / RLS → honest empty state.
        setDocs([])
        return
      }

      // Resolve linked contact names in one batch.
      const contactIds = Array.from(
        new Set((data ?? []).map((r) => (r.metadata as { contact_id?: string } | null)?.contact_id).filter(Boolean) as string[])
      )
      const nameById = new Map<string, { name: string; type: string }>()
      if (contactIds.length > 0) {
        const { data: cs } = await supabase
          .from("contacts")
          .select("id, display_name, type")
          .eq("workspace_id", workspace.id)
          .in("id", contactIds)
        for (const c of cs ?? []) nameById.set(c.id as string, { name: (c.display_name as string) ?? "Unknown", type: (c.type as string) ?? "other" })
      }

      const rows: LiveDocument[] = (data ?? []).map((row) => {
        const cid = (row.metadata as { contact_id?: string } | null)?.contact_id
        const linked = cid ? nameById.get(cid) : undefined
        const contactName = linked?.name ?? "—"
        const contactRole = linked?.type ?? "—"
        const fileName = (row.r2_key as string | null)?.split("/").pop() ?? row.name
        const category = (row.category as string | null) ?? "Other"
        const uploaded = new Date(row.created_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

        // Derive expiry-aware status & days-left from the real expires_at.
        const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null
        let daysLeft: string | undefined
        let status: DocStatus = row.status === "needs_review" ? "needs_review" : "verified"
        if (expiresAt) {
          const days = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
          if (days < 0) { status = "expired"; daysLeft = "Expired" }
          else if (days <= 45) { status = "expiring"; daysLeft = `${days} day${days === 1 ? "" : "s"} left` }
          else { daysLeft = `${days} days left` }
        }

        return {
          id: row.id as string,
          name: row.name as string,
          ref: fileName,
          fileType: mimeToFileType(row.mime_type as string | null),
          contactName,
          contactRole: contactRole.charAt(0).toUpperCase() + contactRole.slice(1),
          category,
          uploaded,
          expiry: expiresAt ? expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null,
          daysLeft,
          status,
          size: fmtSize(row.size_bytes as number | null),
          url: (row.url as string | null) ?? null,
        }
      })
      setDocs(rows)
    } catch {
      setDocs([])
    } finally {
      setLoadingDocs(false)
    }
  }, [workspace?.id])

  useEffect(() => { void loadDocs() }, [loadDocs])

  // Contact options for the upload/request modals.
  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, display_name")
        .eq("workspace_id", workspace.id)
        .is("deleted_at", null)
        .order("display_name", { ascending: true })
        .limit(500)
      if (!error && data) setContactOptions(data as { id: string; display_name: string }[])
    })()
  }, [workspace?.id])

  const filtered = docs.filter((doc) => {
    const matchCat = activeCategory === "All" || doc.category === activeCategory
    const matchSearch =
      !search.trim() ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.contactName.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalDocs = docs.length
  const verified = docs.filter((d) => d.status === "verified").length
  const verifiedPct = totalDocs > 0 ? Math.round((verified / totalDocs) * 100) : 0
  const expiringSoon = docs.filter((d) => d.status === "expiring").length
  const needsReview = docs.filter((d) => d.status === "needs_review").length

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Documents"
        subtitle="Contact files"
        primaryAction={{ label: "Upload document", icon: Upload, onClick: () => setShowUploadModal(true) }}
        overflowActions={[
          { label: "Request document", icon: Send, onClick: () => setShowRequestModal(true) },
        ]}
      />
      <div className="md:hidden -mx-4">
        <ContactsTabNav />
      </div>
      <div className="hidden md:block">
        <ContactsTabNav />
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-6">
        {/* Mobile search */}
        <div className="md:hidden">
          <MobilePageHeader hideTitle
            title="Documents"
            count={`${filtered.length} document${filtered.length === 1 ? "" : "s"}`}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search documents…"
            className="mb-0"
          />
        </div>
        {/* Header */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage contact documents, compliance files and certifications</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Request Document
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ContactsKpiCard
            label="Total Documents"
            value={totalDocs}
            icon={<FileText className="w-5 h-5 text-[var(--brand)]" />}
            accentColor="bg-[var(--brand-soft)]"
          />
          <ContactsKpiCard
            label="Verified"
            value={`${verified} (${verifiedPct}%)`}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            accentColor="bg-emerald-50"
          />
          <ContactsKpiCard
            label="Expiring Soon"
            value={expiringSoon}
            alert={expiringSoon > 0 ? "Action needed" : undefined}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            accentColor="bg-amber-50"
          />
          <ContactsKpiCard
            label="Needs Review"
            value={needsReview}
            icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
            accentColor="bg-orange-50"
          />
        </div>

        {/* Expiry alert banner */}
        {expiringSoon > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {expiringSoon} {expiringSoon === 1 ? "document" : "documents"} expiring soon
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Review and renew documents before they expire
              </p>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat ? "bg-[var(--brand)] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Main table */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Table controls */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  aria-label="Search documents"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <ResponsiveTable
                rows={loadingDocs ? [] : filtered}
                emptyState={
                  <div className="py-16 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {docs.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}
                    </p>
                  </div>
                }
                mobile={{
                  getKey: (d) => d.id,
                  title: (d) => d.name,
                  subtitle: (d) => d.contactName,
                  leading: (d) => <FileTypeIcon type={d.fileType} />,
                  badge: (d) => {
                    const sCfg = STATUS_CONFIG[d.status]
                    return <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", sCfg.cls)}>{sCfg.label}</span>
                  },
                  fields: [
                    { label: "Category", render: (d) => d.category },
                    { label: "Uploaded", render: (d) => d.uploaded },
                    { label: "Expiry", render: (d) => d.expiry || "No expiry" },
                    { label: "Size", render: (d) => d.size },
                  ],
                  actions: (d) => (
                    <div className="flex items-center gap-3">
                      <button onClick={() => handlePreview(d)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] px-2 py-1">
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button onClick={() => handleDownload(d)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 px-2 py-1">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  ),
                }}
                className="p-3"
              >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Document</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Linked Contact</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Category</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Uploaded</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Expiry</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Size</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-400">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-[var(--brand)] animate-spin" />
                            <span className="text-sm">Loading documents…</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map((doc) => {
                      const sCfg = STATUS_CONFIG[doc.status]
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <FileTypeIcon type={doc.fileType} />
                              <div>
                                <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{doc.name}</p>
                                <p className="text-[10px] text-slate-400">{doc.ref}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0", avatarBg(doc.contactName))}>
                                {initials(doc.contactName)}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-700 whitespace-nowrap">{doc.contactName}</p>
                                <p className="text-[10px] text-slate-400">{doc.contactRole}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 whitespace-nowrap">{doc.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 whitespace-nowrap">{doc.uploaded}</span>
                          </td>
                          <td className="px-4 py-3">
                            {doc.expiry ? (
                              <div>
                                <p className="text-xs text-slate-600 whitespace-nowrap">{doc.expiry}</p>
                                {doc.daysLeft && (
                                  <p className={cn("text-[10px] mt-0.5", parseInt(doc.daysLeft.replace(/\D/g, "")) <= 45 ? "text-amber-600 font-medium" : "text-slate-400")}>
                                    {doc.daysLeft}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No expiry</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", sCfg.cls)}>
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{doc.size}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handlePreview(doc)} title="Preview" aria-label={`Preview ${doc.name}`} className="p-1.5 rounded-md text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDownload(doc)} title="Download" aria-label={`Download ${doc.name}`} className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!loadingDocs && filtered.length === 0 && (
                  <div className="py-16 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {docs.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}
                    </p>
                    {docs.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">Upload a document to get started</p>
                    )}
                  </div>
                )}
              </div>
              </ResponsiveTable>
            </div>
          </div>

          {/* Right panel */}
          <aside className="w-full xl:w-64 shrink-0 xl:sticky xl:top-6 space-y-4">
            {/* Expiry Monitor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 mb-3">Expiry Monitor</h3>
              {docs.filter((d) => d.expiry).length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No documents with expiry dates.</p>
              ) : (
                <div className="space-y-3">
                  {docs.filter((d) => d.expiry).slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-amber-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.contactName}</p>
                        <p className="text-[10px] font-semibold mt-0.5 text-amber-600">{item.expiry}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 mb-3">Document Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "Total documents",  value: String(totalDocs) },
                  { label: "Verified",         value: String(verified) },
                  { label: "Needs review",     value: String(needsReview) },
                  { label: "Expiring soon",    value: String(expiringSoon) },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="font-semibold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showUploadModal && (
        <UploadModal
          workspaceId={workspace?.id}
          contacts={contactOptions}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(msg) => { setShowUploadModal(false); showToast(msg); void loadDocs() }}
        />
      )}
      {showRequestModal && (
        <RequestModal
          workspaceId={workspace?.id}
          contacts={contactOptions}
          onClose={() => setShowRequestModal(false)}
          onSuccess={(msg) => { setShowRequestModal(false); showToast(msg) }}
        />
      )}

      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-xl">
          {toast.msg}
        </div>
      )}
    </DashboardContainer>
  )
}
