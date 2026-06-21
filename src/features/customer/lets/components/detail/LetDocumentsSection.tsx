"use client"

import { FileText } from "lucide-react"
import { useCustomerToast } from "../../../components/toast"

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  )
}

const DOCS: [string, string][] = [
  ["EPC certificate", "PDF · 0.4 MB"],
  ["Floorplan", "PDF · 0.8 MB"],
  ["How to Rent guide", "PDF · 1.1 MB"],
]

export default function LetDocumentsSection() {
  const { toast } = useCustomerToast()
  return (
    <Card title="Documents">
      {DOCS.map(([n, s]) => (
        <button
          key={n}
          onClick={() => toast(`Downloading ${n}…`, "info")}
          className="w-full flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0 text-left"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="flex-1">
            <span className="block text-[12px] font-medium text-slate-700">{n}</span>
            <span className="block text-[10px] text-slate-400">{s}</span>
          </span>
        </button>
      ))}
    </Card>
  )
}
