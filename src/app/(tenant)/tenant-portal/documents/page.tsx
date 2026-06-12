"use client"

import React, { useEffect, useState } from "react"
import { FolderOpen, FileText, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"
import { EvidenceUpload, type EvidenceDoc } from "@/components/work/EvidenceUpload"
import { createClient } from "@/lib/supabase/client"
import {
  resolveTenantContext, formatDate,
  type TenantContext,
} from "../_lib/tenant-context"

interface DocRow {
  id: string
  name: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  created_at: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function TenantDocumentsPage() {
  const [ctx, setCtx] = useState<TenantContext | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }
        setCtx(tenant)

        // LIVE documents shared with this tenant (42P01-safe)
        try {
          const { data, error: fetchErr } = await supabase
            .from("tenant_documents")
            .select("id, name, file_url, file_type, file_size, created_at")
            .eq("contact_id", tenant.contactId)
            .order("created_at", { ascending: false })
          if (fetchErr && code(fetchErr) !== "42P01") {
            setError("Could not load documents.")
          } else if (data) {
            setDocs(data as unknown as DocRow[])
          }
        } catch { /* tolerate */ }
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading documents.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const initialDocs: EvidenceDoc[] = docs.map((d) => ({
    name: d.name ?? "Document",
    url: d.file_url ?? "#",
    type: d.file_type ?? "",
    size: d.file_size ?? 0,
  }))

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FolderOpen className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">Your tenancy agreement, certificates and shared files</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Shared documents */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Shared with You</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No documents have been shared with you yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.name || "Document"}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(d.created_at)}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader><CardTitle>Upload a Document</CardTitle></CardHeader>
        <CardContent>
          <EvidenceUpload
            workspaceId={ctx?.workspaceId ?? undefined}
            folder="tenant-documents"
            table="tenant_documents"
            extra={{ contact_id: ctx?.contactId }}
            initialDocs={initialDocs}
          />
          <p className="text-xs text-slate-400 mt-3">
            Upload references, ID, proof of address or correspondence. Files are stored securely and shared with
            your managing agent.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
