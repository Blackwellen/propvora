"use client"

import { Upload } from "lucide-react"
import { useCustomerToast } from "../../../components/toast"

interface UploadGroup {
  title: string
  items: string[]
}

interface Props {
  stepName: string
  stepIndex: number
  groups: UploadGroup[]
}

export default function WizardStepPanel({ stepName, stepIndex, groups }: Props) {
  const { toast } = useCustomerToast()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[15px] font-bold text-slate-900">{stepName}</h3>
      <p className="text-[12.5px] text-slate-500 mt-1 mb-4">
        {stepIndex === 4
          ? "Upload the required documents to support your application. All files are encrypted and securely stored."
          : "Complete this step to continue your application."}
      </p>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[12.5px] font-semibold text-slate-700 mb-2">{g.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.items.map((it) => (
                <button
                  key={it}
                  onClick={() => toast(`Upload "${it}" (upload-only) — coming soon`, "info")}
                  className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/30 transition"
                >
                  <span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{it}</p>
                    <p className="text-[10.5px] text-slate-400">Drag &amp; drop or click to upload</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
