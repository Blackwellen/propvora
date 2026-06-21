import { Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function StepDocuments() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Upload property documents (optional at this stage).</p>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-[#2563EB]/50 hover:bg-blue-50/30 transition-all cursor-pointer">
        <Upload className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Drop files here or click to upload</p>
        <p className="text-xs text-slate-500 mt-1">EPC, Gas Safety, EICR, Tenancy agreements, etc.</p>
        <Button variant="soft" size="sm" className="mt-4">Browse files</Button>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
        Supported: PDF, Word, Excel, JPEG, PNG — Max 20MB per file
      </div>
    </div>
  )
}
