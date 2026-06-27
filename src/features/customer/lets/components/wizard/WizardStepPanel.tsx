"use client"

import { useRef, useState } from "react"
import { Upload, CheckCircle2, Loader2 } from "lucide-react"
import { useCustomerToast } from "../../../components/toast"

interface UploadGroup {
  title: string
  items: string[]
}

interface Props {
  stepName: string
  stepIndex: number
  groups: UploadGroup[]
  applicationId: string
}

export default function WizardStepPanel({ stepName, stepIndex, groups, applicationId }: Props) {
  const { toast } = useCustomerToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingDocType = useRef<string>("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})

  function pick(docType: string) {
    if (uploading) return
    pendingDocType.current = docType
    fileRef.current?.click()
  }

  async function onPicked(file: File | undefined) {
    const docType = pendingDocType.current
    pendingDocType.current = ""
    if (fileRef.current) fileRef.current.value = ""
    if (!file || !docType) return
    setUploading(docType)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast("Please sign in again.", "error"); return }
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase()
      const path = `customers/${user.id}/applications/${applicationId}/${Date.now()}.${ext}`
      const up = await supabase.storage.from("customer-files").upload(path, file, { contentType: file.type, upsert: false })
      if (up.error) { toast("Upload failed.", "error"); return }
      const rec = await fetch("/api/customer/lets/applications/documents", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, docType, r2Key: path, fileName: file.name, contentType: file.type }),
      })
      if (!rec.ok) { toast("Could not save the document.", "error"); return }
      setUploaded((u) => ({ ...u, [docType]: true }))
      toast(`"${docType}" uploaded.`, "success")
    } catch { toast("Something went wrong.", "error") } finally { setUploading(null) }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[15px] font-bold text-slate-900">{stepName}</h3>
      <p className="text-[12.5px] text-slate-500 mt-1 mb-4">
        {stepIndex === 4
          ? "Upload the required documents to support your application. All files are encrypted and securely stored."
          : "Complete this step to continue your application."}
      </p>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => onPicked(e.target.files?.[0])} />
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[12.5px] font-semibold text-slate-700 mb-2">{g.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.items.map((it) => {
                const isDone = uploaded[it]
                const isBusy = uploading === it
                return (
                  <button
                    key={it}
                    onClick={() => pick(it)}
                    disabled={!!uploading}
                    className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 text-left transition disabled:opacity-60 ${isDone ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)]/30"}`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : isDone ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">{it}</p>
                      <p className="text-[10.5px] text-slate-400">{isDone ? "Uploaded — tap to replace" : isBusy ? "Uploading…" : "Click to upload"}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
