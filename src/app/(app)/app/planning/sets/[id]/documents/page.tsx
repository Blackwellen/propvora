"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Search,
  Upload,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  File,
  Eye,
  CheckCircle2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace, useAuth } from "@/providers/AuthProvider"
import type { PlanningDocument, DocumentCategory, DocumentStatus } from "@/lib/planning/types"

const DOCS_BUCKET = "planning-documents"
const MAX_DOC_BYTES = 25 * 1024 * 1024 // 25MB
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "csv"]

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DocumentStatus, { label: string; cls: string }> = {
  missing:    { label: "Missing",    cls: "bg-red-100 text-red-700" },
  expired:    { label: "Expired",    cls: "bg-amber-100 text-amber-700" },
  unreadable: { label: "Unreadable", cls: "bg-red-100 text-red-700" },
  valid:      { label: "Valid",      cls: "bg-green-100 text-green-700" },
  approved:   { label: "Approved",   cls: "bg-emerald-100 text-emerald-700" },
  uploaded:   { label: "Uploaded",   cls: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
}

// ── File icon ─────────────────────────────────────────────────────────────────

function FileIcon({ name }: { name: string }) {
  const ext = name?.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <div style={{ color: "var(--color-success)" }}><ImageIcon className="w-5 h-5" /></div>
  }
  if (["doc", "docx"].includes(ext)) {
    return <div style={{ color: "#2563EB" }}><FileText className="w-5 h-5" /></div>
  }
  if (ext === "pdf") {
    return <div style={{ color: "var(--color-danger-500, #EF4444)" }}><FileText className="w-5 h-5" /></div>
  }
  return <div style={{ color: "var(--text-disabled)" }}><File className="w-5 h-5" /></div>
}

// ── Action button per status ──────────────────────────────────────────────────

function ActionButton({ doc, onView }: { doc: PlanningDocument; onView: (d: PlanningDocument) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onView(doc) }}
      className="h-7 px-3 rounded-lg border border-[var(--color-brand-100)] text-[var(--brand)] text-[10px] font-semibold hover:bg-[var(--brand-soft)] transition-colors inline-flex items-center gap-1"
    >
      <Eye className="w-3 h-3" /> View
    </button>
  )
}

// ── Category tab type ─────────────────────────────────────────────────────────

type DocTab = "all" | DocumentCategory

const DOC_CATEGORIES: { key: DocTab; label: string }[] = [
  { key: "all", label: "All Documents" },
  { key: "compliance", label: "Compliance" },
  { key: "offer", label: "Offer" },
  { key: "property", label: "Property" },
  { key: "financial", label: "Financial" },
  { key: "legal", label: "Legal" },
  { key: "insurance", label: "Insurance" },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const params = useParams()
  const id = params.id as string
  const { workspace } = useWorkspace()
  const { user } = useAuth()

  const [docs, setDocs] = useState<PlanningDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DocTab>("all")
  const [activeFolder, setActiveFolder] = useState<DocTab>("all")
  const [search, setSearch] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<PlanningDocument | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    if (!id || !workspace?.id) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("planning_documents")
      .select("*")
      .eq("planning_set_id", id)
      .eq("workspace_id", workspace.id)
      .order("uploaded_at", { ascending: false })
    setDocs(error ? [] : ((data ?? []) as PlanningDocument[]))
    setLoading(false)
  }

  useEffect(() => {
    if (!id || !workspace?.id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, workspace?.id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file || !workspace?.id || !id) return
    setUploadError(null)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXT.includes(ext)) { setUploadError(`Unsupported file type .${ext}`); return }
    if (file.size > MAX_DOC_BYTES) { setUploadError("File is larger than 25MB."); return }
    setUploading(true)
    try {
      const supabase = createClient()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const path = `${workspace.id}/${id}/${crypto.randomUUID()}-${safeName}`
      const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const category: DocumentCategory = (activeTab !== "all" ? activeTab : "property")
      const { error: insErr } = await supabase.from("planning_documents").insert({
        workspace_id: workspace.id,
        planning_set_id: id,
        title: file.name.replace(/\.[^.]+$/, ""),
        file_name: file.name,
        file_path: path,
        category,
        status: "uploaded",
        uploaded_by: user?.id ?? null,
      })
      if (insErr) {
        // Roll back the orphaned upload if the row insert fails.
        await supabase.storage.from(DOCS_BUCKET).remove([path])
        throw insErr
      }
      await load()
    } catch {
      setUploadError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  async function handleView(doc: PlanningDocument) {
    if (!doc.file_path) return
    const supabase = createClient()
    const { data } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(doc.file_path, 120)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  // Live counts per category
  function countFor(key: DocTab): number {
    return key === "all" ? docs.length : docs.filter((d) => d.category === key).length
  }

  const filteredDocs = docs.filter((d) => {
    const catMatch = activeTab === "all" || d.category === activeTab
    const searchMatch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.file_name ?? "").toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch
  })

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section Header + Controls ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5">Document hub for this planning set.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="h-8 pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-violet-300 w-44"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Upload Documents"}
          </button>
        </div>
      </div>
      {uploadError && <p className="text-[11px] text-red-600 -mt-2">{uploadError}</p>}

      {/* ── Category Tab Bar ── */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 pb-0">
        {DOC_CATEGORIES.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-[#7C3AED] text-[#7C3AED]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            <span className="ml-1 text-[9px] font-bold bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">{countFor(t.key)}</span>
          </button>
        ))}
      </div>

      {/* ── 2-column main ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* LEFT: Folder Rail */}
        <div className="w-full md:w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div className="flex flex-col gap-0.5">
              {DOC_CATEGORIES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setActiveFolder(f.key); setActiveTab(f.key) }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeFolder === f.key
                      ? "bg-violet-50 text-[#7C3AED]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    {f.label.replace(" Documents", "")}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{countFor(f.key)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Document Library */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-semibold text-slate-700">No documents yet</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload compliance certificates, offer summaries, property records and other documents for this planning set.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading…" : "Upload Documents"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDocs.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status] ?? { label: doc.status ?? "—", cls: "bg-slate-100 text-slate-600" }
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2.5 cursor-pointer hover:border-violet-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <FileIcon name={doc.file_name ?? ""} />
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{doc.file_name ?? "No file"}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase bg-slate-100 text-slate-600 tracking-wide">
                        {doc.category}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {doc.uploaded_at && (
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Uploaded</span>
                          <span>{doc.uploaded_at.slice(0, 10)}</span>
                        </div>
                      )}
                      {doc.expires_at && (
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Expires</span>
                          <span>{doc.expires_at.slice(0, 10)}</span>
                        </div>
                      )}
                      {doc.linked_to && (
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Linked To</span>
                          <span className="truncate max-w-[120px] text-right">{doc.linked_to}</span>
                        </div>
                      )}
                    </div>
                    <ActionButton doc={doc} onView={handleView} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Document Preview Section ── */}
      {selectedDoc && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 truncate">Document Preview — {selectedDoc.title}</h3>
            <button onClick={() => setSelectedDoc(null)} className="text-[11px] text-slate-400 hover:text-slate-600 flex-shrink-0">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-slate-100">
            {/* Thumbnail */}
            <div className="p-5 flex flex-col items-center justify-center gap-3">
              <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{selectedDoc.file_name ?? "No file uploaded"}</span>
              {selectedDoc.file_path && (
                <button
                  onClick={() => handleView(selectedDoc)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-[var(--color-brand-100)] text-[var(--brand)] text-[10px] font-semibold hover:bg-[var(--brand-soft)]"
                >
                  <Eye className="w-3 h-3" />
                  View Full Document
                </button>
              )}
            </div>
            {/* Metadata */}
            <div className="p-5">
              <h4 className="text-xs font-semibold text-slate-800 mb-3">Details</h4>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Category</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize">{selectedDoc.category}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Status</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize">{selectedDoc.status}</span>
                </div>
                {selectedDoc.expires_at && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Expires</span>
                    <span className="text-xs font-semibold text-slate-800">{selectedDoc.expires_at.slice(0, 10)}</span>
                  </div>
                )}
                {selectedDoc.notes && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Notes</span>
                    <span className="text-xs text-slate-700">{selectedDoc.notes}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Linked + Approvals */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-2">Linked Items</h4>
                {selectedDoc.linked_to ? (
                  <span className="text-xs text-slate-600">{selectedDoc.linked_to}</span>
                ) : (
                  <span className="text-xs text-slate-400">None linked</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-2">Approvals</h4>
                <div className="flex items-center gap-2">
                  {selectedDoc.status === "approved" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-xs text-slate-600 capitalize">{selectedDoc.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
