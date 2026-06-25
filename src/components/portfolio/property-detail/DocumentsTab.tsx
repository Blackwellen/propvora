"use client"

import React, { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import MobileTabs from "@/components/mobile/MobileTabs"
import {
  Plus, Upload, Download, FileText, Eye,
} from "lucide-react"
import { Card } from "./shared"

export function DocumentsTab() {
  const params = useParams()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()

  const [docCat, setDocCat] = useState("All")
  const catTabs = ["All", "Documents", "Images", "Videos", "Plans"]
  const [docDragOver, setDocDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<{
    name: string; url: string; size: string; category: string;
    uploaded: string; uploadedBy: string; expiry: string; status: string
  }[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

  const statusColor = (s: string) =>
    s === "Active" ? "text-emerald-600" : s === "Expiring" ? "text-amber-600" : "text-slate-500"

  async function handleDocUpload(file: File) {
    if (!workspace?.id) return
    setUploading(true)
    try {
      // 1. Server-proxied upload to R2 → authed view URL
      const { url: publicUrl } = await uploadFile(file, workspace.id, "property-documents")

      // 2. Save to Supabase (property_documents table, 42P01 fallback)
      try {
        const supabase = createClient()
        await supabase.from("property_documents").insert({
          workspace_id: workspace.id,
          property_id: propertyId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: "Documents",
          uploaded_by: "You",
        })
      } catch (e: any) {
        if (e?.code !== "42P01") console.error("Doc save error:", e)
        // 42P01 = table doesn't exist yet — still add to local state
      }

      // 5. Optimistic UI
      setUploadedDocs((prev) => [{
        name: file.name,
        url: publicUrl,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        category: "Documents",
        uploaded: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        uploadedBy: "You",
        expiry: "—",
        status: "Active",
      }, ...prev])
    } catch (err) {
      console.error("Doc upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mobile category sub-tabs — scrollable strip */}
      <div className="md:hidden">
        <MobileTabs
          tabs={catTabs.map((t) => ({ id: t, label: t }))}
          value={docCat}
          onChange={setDocCat}
          aria-label="Document categories"
        />
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="hidden md:flex gap-1 bg-slate-100 rounded-xl p-1">
          {catTabs.map((t) => (
            <button
              key={t}
              onClick={() => setDocCat(t)}
              className={cn(
                "text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all",
                docCat === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            <Plus size={13} /> New Folder
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDocDragOver(true) }}
        onDragLeave={() => setDocDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDocDragOver(false)
          const files = Array.from(e.dataTransfer.files)
          files.forEach(handleDocUpload)
        }}
        onClick={() => docInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
          docDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            files.forEach(handleDocUpload)
            e.target.value = ""
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          {uploading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <Upload size={22} className="text-slate-400" />
          )}
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-slate-700">
            {uploading ? "Uploading…" : "Drop files here or click to browse"}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">PDF, images, Word, Excel — up to 10MB each</p>
        </div>
      </div>

      {/* Documents table — live uploads only */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[14px] font-bold text-slate-900">Documents</p>
        </div>
        {uploadedDocs.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <FileText size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No documents uploaded yet</p>
            <p className="text-[12px] text-slate-500 mt-1">Upload certificates, plans and reports above. Files are stored securely.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Name", "Category", "Uploaded", "Uploaded By", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedDocs.map((doc) => (
                  <tr key={doc.url} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-slate-400 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {doc.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.category}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{doc.uploaded}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[12px] font-semibold", statusColor(doc.status))}>{doc.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 inline-flex"><Eye size={13} className="text-slate-400" /></a>
                        <a href={doc.url} download={doc.name} className="p-1.5 rounded hover:bg-slate-100 inline-flex">
                          <Download size={13} className="text-slate-400" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
