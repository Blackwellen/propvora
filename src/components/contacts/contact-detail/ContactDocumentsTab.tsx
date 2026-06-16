"use client"

import React from "react"
import { FolderOpen, FileText, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { EmptyState, StatusChip } from "./shared"
import { useContactSave } from "./ContactSaveContext"

interface Props {
  contactId: string
  workspaceId: string | undefined
}

export function ContactDocumentsTab({ contactId, workspaceId }: Props) {
  const { editable } = useContactSave()
  const [docs, setDocs] = React.useState<Array<{ id: string; name: string; status: string; created_at: string; url: string | null }>>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { data, error } = await supabase
      .from("documents")
      .select("id, name, status, created_at, url, metadata")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) { setDocs([]); setLoading(false); return }
    const mine = (data ?? []).filter((d) => (d.metadata as { contact_id?: string } | null)?.contact_id === contactId)
    setDocs(mine.map((d) => ({ id: d.id as string, name: d.name as string, status: (d.status as string) ?? "uploaded", created_at: d.created_at as string, url: (d.url as string | null) ?? null })))
    setLoading(false)
  }, [workspaceId, contactId])

  React.useEffect(() => { void load() }, [load])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !workspaceId) return
    setUploading(true)
    try {
      const { uploadFile } = await import("@/lib/upload")
      const { createClient } = await import("@/lib/supabase/client")
      const up = await uploadFile(file, workspaceId, "contacts")
      const supabase = createClient()
      await supabase.from("documents").insert({
        workspace_id: workspaceId,
        name: file.name,
        mime_type: up.type || file.type || null,
        size_bytes: up.size ?? file.size,
        r2_key: up.key,
        r2_bucket: "propvora",
        url: up.url,
        status: "uploaded",
        metadata: { contact_id: contactId },
      })
      await load()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" className="hidden" onChange={onPick} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{docs.length} document{docs.length === 1 ? "" : "s"}</p>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} disabled={!editable || uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload Document"}
        </Button>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading documents…</div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FolderOpen} message="No documents yet. Upload one to get started." />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <StatusChip status={doc.status} />
              <div className="flex gap-1">
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"><Download className="w-3.5 h-3.5" /></a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
