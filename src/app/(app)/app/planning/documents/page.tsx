"use client"

import React, { useState } from "react"
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Image,
  Archive,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  File,
  FolderOpen,
} from "lucide-react"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { PlanningTabNav } from "@/components/planning/PlanningTabNav"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

/* ─── Types & demo data ─────────────────────────────────────────────────────── */

interface PlanningDocument {
  id: string
  name: string
  type: string
  size: string
  planningSet: string
  uploadedAt: string
  status: string
}

const DEMO_DOCS: PlanningDocument[] = [
  { id: "d1", name: "HMO Heads of Terms — Draft.pdf",       type: "Contract Draft",   size: "2.1 MB",  planningSet: "12-Room HMO — Nottingham",    uploadedAt: "2026-05-28", status: "Final"    },
  { id: "d2", name: "HMO Licence Application.pdf",            type: "Compliance Quote", size: "845 KB",  planningSet: "12-Room HMO — Nottingham",    uploadedAt: "2026-05-25", status: "Draft"    },
  { id: "d3", name: "Landlord Offer Letter — Victoria Rd.docx",type: "Offer Letter",   size: "134 KB",  planningSet: "R2R Deal — Birmingham",        uploadedAt: "2026-05-20", status: "Final"    },
  { id: "d4", name: "SA Revenue Model — Manchester.xlsx",     type: "Financial Model",  size: "1.8 MB",  planningSet: "SA — Manchester Piccadilly",   uploadedAt: "2026-05-19", status: "Active"   },
  { id: "d5", name: "Fire Safety Quote.pdf",                  type: "Compliance Quote", size: "512 KB",  planningSet: "12-Room HMO — Nottingham",    uploadedAt: "2026-05-15", status: "Quote"    },
  { id: "d6", name: "Holiday Let Compliance Pack.pdf",        type: "Planning Report",  size: "3.2 MB",  planningSet: "Holiday Let — Lake District",  uploadedAt: "2026-05-10", status: "Final"    },
  { id: "d7", name: "Property Photos — 48 Talbot St.zip",    type: "Photos",           size: "28.4 MB", planningSet: "12-Room HMO — Nottingham",    uploadedAt: "2026-05-05", status: "Archived" },
  { id: "d8", name: "Student Let Agreement Template.docx",    type: "Contract Draft",   size: "98 KB",   planningSet: "Student Let — Sheffield",      uploadedAt: "2026-04-28", status: "Draft"    },
]

const DOC_TYPES = ["All Types", "Contract Draft", "Compliance Quote", "Offer Letter", "Financial Model", "Planning Report", "Photos", "Other"]
const PLANNING_SETS = ["All Sets", "12-Room HMO — Nottingham", "R2R Deal — Birmingham", "SA — Manchester Piccadilly", "Holiday Let — Lake District", "Student Let — Sheffield"]

const STATUS_CONFIG: Record<string, { variant: "default" | "primary" | "success" | "warning" | "danger" | "ai"; label: string }> = {
  Final:    { variant: "success",  label: "Final"    },
  Draft:    { variant: "default",  label: "Draft"    },
  Active:   { variant: "primary",  label: "Active"   },
  Quote:    { variant: "warning",  label: "Quote"    },
  Archived: { variant: "default",  label: "Archived" },
}

/* ─── File icon helper ──────────────────────────────────────────────────────── */

function getFileIcon(type: string, name: string): { Icon: React.ComponentType<{ className?: string }>; colour: string } {
  if (type === "Photos" || name.endsWith(".zip")) return { Icon: Image,           colour: "#7C3AED" }
  if (type === "Financial Model")                  return { Icon: FileSpreadsheet, colour: "#10B981" }
  if (name.endsWith(".pdf"))                        return { Icon: FileText,        colour: "#EF4444" }
  if (name.endsWith(".docx"))                       return { Icon: FileText,        colour: "#2563EB" }
  return                                                   { Icon: File,            colour: "#64748B" }
}

/* ─── Dropzone ──────────────────────────────────────────────────────────────── */

function DropZone() {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false) }}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group",
        dragging
          ? "border-[#7C3AED] bg-violet-50"
          : "border-slate-200 bg-slate-50/50 hover:border-violet-300 hover:bg-violet-50/50"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all",
        dragging ? "bg-[#7C3AED]/20" : "bg-slate-100 group-hover:bg-violet-100"
      )}>
        <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-[#7C3AED]" : "text-slate-400 group-hover:text-violet-500")} />
      </div>
      <p className="text-sm font-semibold text-slate-900">
        {dragging ? "Drop files here" : "Drag & drop files to upload"}
      </p>
      <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel, ZIP, Images — up to 50MB each</p>
      <button className="mt-3 text-xs font-semibold text-[#7C3AED] hover:underline underline-offset-2">
        Or click to browse
      </button>
    </div>
  )
}

/* ─── Filter Bar ────────────────────────────────────────────────────────────── */

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  typeFilter: string
  onTypeFilter: (v: string) => void
  setFilter: string
  onSetFilter: (v: string) => void
}

function FilterBar({ search, onSearch, typeFilter, onTypeFilter, setFilter, onSetFilter }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
        />
      </div>

      {/* Type filter */}
      <div className="relative">
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilter(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all cursor-pointer"
        >
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      {/* Set filter */}
      <div className="relative">
        <select
          value={setFilter}
          onChange={(e) => onSetFilter(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all cursor-pointer"
        >
          {PLANNING_SETS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Filter className="w-3.5 h-3.5" />
        <span>Filtered</span>
      </div>
    </div>
  )
}

/* ─── Document type summary cards ───────────────────────────────────────────── */

const TYPE_SUMMARY = [
  { type: "Contract Draft",   count: 2, colour: "#2563EB", Icon: FileText },
  { type: "Compliance Quote", count: 2, colour: "#EF4444", Icon: FileText },
  { type: "Offer Letter",     count: 1, colour: "#7C3AED", Icon: FileText },
  { type: "Financial Model",  count: 1, colour: "#10B981", Icon: FileSpreadsheet },
  { type: "Planning Report",  count: 1, colour: "#F59E0B", Icon: FolderOpen },
  { type: "Photos",           count: 1, colour: "#0EA5E9", Icon: Image },
]

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function DocumentsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [setFilter, setSetFilter] = useState("All Sets")
  const [archivedHidden, setArchivedHidden] = useState(false)

  const filtered = DEMO_DOCS.filter((doc) => {
    const matchSearch = search === "" || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.planningSet.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "All Types" || doc.type === typeFilter
    const matchSet = setFilter === "All Sets" || doc.planningSet === setFilter
    const matchArchived = !archivedHidden || doc.status !== "Archived"
    return matchSearch && matchType && matchSet && matchArchived
  })

  const totalSize = "37.1 MB"

  return (
    <DashboardContainer>
      <div className="space-y-6">
        <PageHeader
          title="Planning Documents"
          description="Supporting documents across all planning sets"
          actions={
            <Button variant="primary">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          }
        />

        <PlanningTabNav />

        {/* Summary strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {TYPE_SUMMARY.map((ts) => (
            <button
              key={ts.type}
              onClick={() => setTypeFilter(ts.type)}
              className={cn(
                "bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-center hover:shadow-md transition-all group",
                typeFilter === ts.type && "ring-2 ring-offset-1"
              )}
              style={typeFilter === ts.type ? { outline: `2px solid ${ts.colour}`, outlineOffset: "2px" } : {}}
            >
              <div className="w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: `${ts.colour}15` }}>
                <ts.Icon className="w-4 h-4" style={{ color: ts.colour }} />
              </div>
              <p className="text-lg font-bold" style={{ color: ts.colour }}>{ts.count}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{ts.type}</p>
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3.5">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-xs text-slate-500">Total documents</p>
              <p className="text-sm font-bold text-slate-900">{DEMO_DOCS.length} files</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Total size</p>
              <p className="text-sm font-bold text-slate-900">{totalSize}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Planning sets covered</p>
              <p className="text-sm font-bold text-slate-900">5 sets</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={archivedHidden}
              onChange={(e) => setArchivedHidden(e.target.checked)}
              className="rounded border-slate-300 accent-[#7C3AED]"
            />
            <span className="text-xs font-medium text-slate-600">Hide archived</span>
          </label>
        </div>

        {/* Drop zone */}
        <DropZone />

        {/* Filter bar */}
        <FilterBar
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          setFilter={setFilter}
          onSetFilter={setSetFilter}
        />

        {/* Document table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {DEMO_DOCS.length} shown</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <FolderOpen className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900">No documents match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
              <button onClick={() => { setSearch(""); setTypeFilter("All Types"); setSetFilter("All Sets") }} className="mt-3 text-xs font-medium text-[#7C3AED] hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Name","Type","Planning Set","Size","Date","Status","Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((doc) => {
                    const { Icon: FileIcon, colour } = getFileIcon(doc.type, doc.name)
                    const statusConf = STATUS_CONFIG[doc.status] ?? { variant: "default" as const, label: doc.status }
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                        {/* Name */}
                        <td className="px-4 py-3 max-w-[240px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colour}15`, color: colour }}>
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 truncate">{doc.name}</span>
                          </div>
                        </td>
                        {/* Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{doc.type}</span>
                        </td>
                        {/* Planning set */}
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px]">
                          <span className="truncate block">{doc.planningSet}</span>
                        </td>
                        {/* Size */}
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{doc.size}</td>
                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{doc.uploadedAt}</td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#2563EB] transition-colors" title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#7C3AED] transition-colors" title="Preview">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#F59E0B] transition-colors" title="Archive">
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#EF4444] transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
