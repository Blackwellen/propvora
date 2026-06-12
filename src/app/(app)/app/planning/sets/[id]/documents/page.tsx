"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Search,
  Filter,
  Upload,
  FolderOpen,
  Plus,
  FileText,
  Image,
  File,
  Sparkles,
  Eye,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningDocument, DocumentCategory, DocumentStatus } from "@/lib/planning/types"

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
  uploaded:   { label: "Uploaded",   cls: "bg-blue-100 text-blue-700" },
}

// ── File icon ─────────────────────────────────────────────────────────────────

function FileIcon({ name }: { name: string }) {
  const ext = name?.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <div style={{ color: "#10B981" }}><Image className="w-5 h-5" /></div>
  }
  if (["doc", "docx"].includes(ext)) {
    return <div style={{ color: "#2563EB" }}><FileText className="w-5 h-5" /></div>
  }
  if (ext === "pdf") {
    return <div style={{ color: "#EF4444" }}><FileText className="w-5 h-5" /></div>
  }
  return <div style={{ color: "#94A3B8" }}><File className="w-5 h-5" /></div>
}

// ── Static fallback documents ─────────────────────────────────────────────────

const STATIC_DOCS: PlanningDocument[] = [
  {
    id: "d1", workspace_id: "", planning_set_id: "",
    title: "Gas Safety Certificate", file_name: "GSC-10435-2025.pdf",
    file_url: null, category: "compliance", status: "missing",
    expires_at: null, linked_to: "Room 1–12", notes: null,
    uploaded_by: null, uploaded_at: "", created_at: "", updated_at: "",
  },
  {
    id: "d2", workspace_id: "", planning_set_id: "",
    title: "EPC Certificate", file_name: "EPC-RE165-2023.pdf",
    file_url: null, category: "compliance", status: "expired",
    expires_at: "2024-02-10", linked_to: "Full Property", notes: null,
    uploaded_by: null, uploaded_at: "", created_at: "", updated_at: "",
  },
  {
    id: "d3", workspace_id: "", planning_set_id: "",
    title: "Electrical Installation Report", file_name: "EICR-2024-001.pdf",
    file_url: null, category: "compliance", status: "unreadable",
    expires_at: "2030-03-28", linked_to: "Full Property", notes: null,
    uploaded_by: null, uploaded_at: "", created_at: "", updated_at: "",
  },
  {
    id: "d4", workspace_id: "", planning_set_id: "",
    title: "HMO License", file_name: "HMO-45478-2025.pdf",
    file_url: null, category: "compliance", status: "valid",
    expires_at: "2026-01-15", linked_to: "Full Property", notes: null,
    uploaded_by: null, uploaded_at: "", created_at: "", updated_at: "",
  },
  {
    id: "d5", workspace_id: "", planning_set_id: "",
    title: "Landlord Offer Summary", file_name: "Offer-Summary.pdf",
    file_url: null, category: "offer", status: "approved",
    expires_at: null, linked_to: "Offer v3", notes: null,
    uploaded_by: "James Taylor", uploaded_at: "2025-05-12", created_at: "", updated_at: "",
  },
  {
    id: "d6", workspace_id: "", planning_set_id: "",
    title: "Title Deed", file_name: "Title-Deed.pdf",
    file_url: null, category: "legal", status: "approved",
    expires_at: null, linked_to: "Property", notes: null,
    uploaded_by: "James Taylor", uploaded_at: "2025-02-20", created_at: "", updated_at: "",
  },
]

// ── Action button per status ──────────────────────────────────────────────────

function ActionButton({ status }: { status: DocumentStatus }) {
  if (status === "missing") return (
    <button className="h-7 px-3 rounded-lg border border-red-300 text-red-600 text-[10px] font-semibold hover:bg-red-50 transition-colors whitespace-nowrap">
      Upload required
    </button>
  )
  if (status === "expired") return (
    <button className="h-7 px-3 rounded-lg border border-amber-300 text-amber-700 text-[10px] font-semibold hover:bg-amber-50 transition-colors">
      Replace
    </button>
  )
  if (status === "unreadable") return (
    <button className="h-7 px-3 rounded-lg border border-red-300 text-red-600 text-[10px] font-semibold hover:bg-red-50 transition-colors whitespace-nowrap">
      Upload Clear Copy
    </button>
  )
  return (
    <button className="h-7 px-3 rounded-lg border border-blue-200 text-blue-600 text-[10px] font-semibold hover:bg-blue-50 transition-colors">
      View
    </button>
  )
}

// ── Category tab type ─────────────────────────────────────────────────────────

type DocTab = "all" | DocumentCategory

const DOC_TABS: { key: DocTab; label: string; count: number }[] = [
  { key: "all", label: "All Documents", count: 42 },
  { key: "compliance", label: "Compliance", count: 18 },
  { key: "offer", label: "Offer", count: 9 },
  { key: "property", label: "Property", count: 6 },
  { key: "financial", label: "Financial", count: 4 },
  { key: "legal", label: "Legal", count: 3 },
  { key: "insurance", label: "Insurance", count: 2 },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const params = useParams()
  const id = params.id as string

  const [docs, setDocs] = useState<PlanningDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DocTab>("all")
  const [activeFolder, setActiveFolder] = useState<DocTab>("all")
  const [search, setSearch] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<PlanningDocument | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_documents")
          .select("*")
          .eq("planning_set_id", id)
          .order("uploaded_at", { ascending: false })
        if (err) throw err
        setDocs((data ?? []) as PlanningDocument[])
      } catch {
        setError("Failed to load documents.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
      </div>
    )
  }

  const displayDocs = docs.length > 0 ? docs : STATIC_DOCS

  const filteredDocs = displayDocs.filter((d) => {
    const catMatch = activeTab === "all" || d.category === activeTab
    const searchMatch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.file_name ?? "").toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch
  })

  const OCR_DATA = [
    { label: "Property Address", value: "12 Elm Street, Nottingham, NG1 2AA" },
    { label: "Certificate Number", value: "GSC-10435-2025" },
    { label: "Assessment Date", value: "10 Jan 2025" },
    { label: "Engineer Name", value: "M. Harrison" },
    { label: "Next Inspection", value: "10 Jan 2026" },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Section Header + Controls ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">9B Documents</h2>
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
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload Documents
          </button>
        </div>
      </div>

      {/* ── Category Tab Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 pb-0">
        {DOC_TABS.map((t) => (
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
            <span className="ml-1 text-[9px] font-bold bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── 2-column main ──────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* LEFT: Folder Rail */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div className="flex flex-col gap-0.5">
              {DOC_TABS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFolder(f.key)}
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
                  <span className="text-[9px] font-bold text-slate-400">{f.count}</span>
                </button>
              ))}
              <button className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                New Folder
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Document Library */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDocs.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status]
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
                    <ActionButton status={doc.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Document Preview Section ───────────────────────────────────────── */}
      {selectedDoc && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Document Preview — {selectedDoc.title}</h3>
            <button onClick={() => setSelectedDoc(null)} className="text-[11px] text-slate-400 hover:text-slate-600">Close</button>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
            {/* PDF Thumbnail */}
            <div className="p-5 flex flex-col items-center justify-center gap-3">
              <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{selectedDoc.file_name ?? "No file uploaded"}</span>
              {selectedDoc.file_url && (
                <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-blue-200 text-blue-600 text-[10px] font-semibold hover:bg-blue-50">
                  <Eye className="w-3 h-3" />
                  View Full Document
                </button>
              )}
            </div>
            {/* OCR Data */}
            <div className="p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <h4 className="text-xs font-semibold text-slate-800">OCR / Extracted Data</h4>
                <span className="text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">BETA</span>
              </div>
              <div className="flex flex-col gap-2">
                {OCR_DATA.map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className="text-xs font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Linked + Approvals + Comments */}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-800">Comments</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">2</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500">Add a comment...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Right AI Panel ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-violet-200 shadow-sm p-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 70%, #EFF6FF 100%)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-violet-900">AI Document Review</span>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { msg: "3 documents may contain missing or incorrect data", color: "bg-red-50 border-red-200" },
            { msg: "2 documents are expiring within 30 days", color: "bg-amber-50 border-amber-200" },
            { msg: "1 document appears to be a duplicate", color: "bg-blue-50 border-blue-200" },
          ].map(({ msg, color }) => (
            <div key={msg} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 bg-white/60 ${color}`}>
              <span className="text-xs text-slate-700">{msg}</span>
              <button className="flex-shrink-0 h-7 px-3 rounded-lg border border-violet-200 text-violet-600 text-[10px] font-semibold hover:bg-violet-50 transition-colors">
                Review
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-800 font-medium">Suggested next step: Upload the Gas Safety Certificate to unblock conversion.</span>
          </div>
          <button className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline">
            Go to task <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
