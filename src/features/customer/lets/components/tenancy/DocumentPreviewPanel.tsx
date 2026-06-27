"use client"

import { Download, FileText, PenLine, Share2 } from "lucide-react"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Doc {
  id: string
  name: string
  category: string
  date: string
  size: string
  status: string
  tone: PillTone
}

interface Props {
  doc: Doc
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-slate-500">{l}</span>
      <span className="text-[12px] font-semibold text-slate-800">{r}</span>
    </div>
  )
}

export default function DocumentPreviewPanel({ doc }: Props) {
  const { toast } = useCustomerToast()
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <p className="text-[13px] font-bold text-slate-900 mb-2">{doc.name}</p>
      <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-400 mb-3">
        <FileText className="w-10 h-10" />
      </div>
      <div className="space-y-1.5">
        <Row l="Category" r={doc.category} />
        <Row l="Date added" r={doc.date} />
        <Row l="File size" r={doc.size} />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Status</span>
          <StatusPill tone={doc.tone}>{doc.status}</StatusPill>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <button
          onClick={() => toast("Downloading…", "info")}
          className="w-full bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Download
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toast("Share link copied", "success")}
            className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button
            onClick={() => toast("Signature requested", "info")}
            className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <PenLine className="w-3.5 h-3.5" /> Sign
          </button>
        </div>
      </div>
    </aside>
  )
}
