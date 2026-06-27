import React from "react"
import { FileText, Download, Trash2 } from "lucide-react"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"

interface MockFile {
  name: string
  size: string
  uploaded: string
  type: string
}

interface TaskFilesTabProps {
  mockFiles: MockFile[]
  workspaceId?: string
  taskId: string
}

export function TaskFilesTab({ mockFiles, workspaceId, taskId }: TaskFilesTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Files &amp; Documents</h3>
      <EvidenceUpload
        workspaceId={workspaceId}
        folder="task-evidence"
        table="task_documents"
        extra={{ task_id: taskId }}
        className="mb-4"
      />
      {mockFiles.length > 0 && (
        <div className="space-y-2">
          {mockFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {file.size} · Uploaded {file.uploaded}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
