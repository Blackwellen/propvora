"use client"

import React, { useState } from "react"
import { CheckCircle2, CheckSquare, Trash2, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskProgressRing } from "./TaskProgressRing"
import {
  useTaskChecklist,
  useAddChecklistItem,
  useToggleChecklistItem,
  useDeleteChecklistItem,
} from "@/hooks/useTaskCollab"

interface TaskLiveChecklistTabProps {
  workspaceId?: string
  taskId: string
}

export function TaskLiveChecklistTab({ workspaceId, taskId }: TaskLiveChecklistTabProps) {
  const { data: items = [], isLoading } = useTaskChecklist(workspaceId, taskId)
  const addItem = useAddChecklistItem()
  const toggleItem = useToggleChecklistItem()
  const deleteItem = useDeleteChecklistItem()
  const [label, setLabel] = useState("")

  const done = items.filter((i) => i.done).length
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0

  async function handleAdd() {
    const text = label.trim()
    if (!text || !workspaceId || addItem.isPending) return
    try {
      await addItem.mutateAsync({ workspaceId, taskId, label: text, position: items.length })
      setLabel("")
    } catch { /* surfaced via disabled state */ }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <TaskProgressRing pct={pct} size={48} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Checklist / Subtasks</h3>
            <p className="text-[11px] text-slate-400 tabular-nums">{done} of {items.length} completed</p>
          </div>
          {items.length > 0 && pct === 100 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> All done
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-9 rounded-lg bg-slate-100 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No checklist items yet</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Break this task into subtasks below.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => workspaceId && toggleItem.mutate({ workspaceId, taskId, id: item.id, done: !item.done })}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 active:scale-90 motion-reduce:active:scale-100",
                    item.done ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 hover:border-[#2563EB]"
                  )}
                  aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                >
                  {item.done && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                </button>
                <p className={cn("flex-1 text-sm transition-colors", item.done ? "line-through text-slate-400" : "text-slate-700")}>{item.label}</p>
                <button
                  onClick={() => workspaceId && deleteItem.mutate({ workspaceId, taskId, id: item.id })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-300 hover:text-red-500"
                  aria-label="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd() } }}
            placeholder="Add a subtask…"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50"
          />
          <button
            onClick={handleAdd}
            disabled={!label.trim() || addItem.isPending || !workspaceId}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[12.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {addItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
          </button>
        </div>
      </div>
    </div>
  )
}
