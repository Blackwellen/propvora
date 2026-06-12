"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  Users,
  AlertTriangle,
  Sparkles,
  MoreHorizontal,
  Calendar,
  Clock,
  DollarSign,
  Paperclip,
  MessageSquare,
  Building2,
  Phone,
  Mail,
  Copy,
  CheckSquare,
  FileText,
  Download,
  Trash2,
  Plus,
  Bold,
  Italic,
  Link2,
  AtSign,
  Home,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkStatusBadge } from "@/components/work/WorkStatusBadge"
import { WorkPriorityBadge } from "@/components/work/WorkPriorityBadge"
import { InlineEditField } from "@/components/work/InlineEditField"
import { StatusChangeDropdown } from "@/components/work/StatusChangeDropdown"
import { ConfirmDeleteDialog } from "@/components/work/ConfirmDeleteDialog"
import { useTask, useUpdateTask, useCompleteTask, useDeleteTask } from "@/hooks/useTasks"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import type { Task, UpdateTask } from "@/types/database"

// ---------------------------------------------------------------------------
// View model — maps a live Task row to the shape the UI expects
// ---------------------------------------------------------------------------
interface TaskView {
  id: string
  title: string
  priority: Task["priority"]
  category: string
  status: Task["status"]
  propertyName: string
  propertyId: string | null
  unit: string
  assigneeName: string
  assigneeInitials: string
  assigneeRole: string
  supplierName: string
  supplierCategory: string
  supplierContact: string
  supplierPhone: string
  supplierEmail: string
  dueDate: string
  dueDays: string
  slaCompliance: number
  slaTarget: string
  slaDue: string
  timeRemaining: string
  costImpact: string
  costLabel: string
  attachments: number
  comments: number
  description: string
  reportedBy: string
  reportedOn: string
  workType: string
  impact: string
  accessRequired: string
  specialInstructions: string
  propertyManager: string
  propertyType: string
  propertyStatus: string
  propertyAddress: string
  checklist: { id: string; text: string; done: boolean; assignee: string; date: string }[]
  linkedRecords: { type: string; label: string; status?: string; href: string }[]
  costEstimate: { labour: number; materials: number; total: number }
  dependencies: { title: string; status: string }[]
  activity: { id: string; type: string; text: string; user: string; time: string; initials: string }[]
  watchers: { name: string; role: string; initials: string }[]
  mockFiles: { name: string; size: string; uploaded: string; type: string }[]
}

function buildTaskView(task: Task): TaskView {
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"

  const dueDays = task.due_date
    ? (() => {
        const diff = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86_400_000)
        if (diff === 0) return "due today"
        if (diff > 0) return `in ${diff} day${diff === 1 ? "" : "s"}`
        return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} overdue`
      })()
    : "—"

  const costTotal = task.estimated_cost ?? 0
  const costLabel = task.actual_cost != null ? "Actual" : "Estimated"
  const costDisplay = task.actual_cost ?? task.estimated_cost ?? 0

  const createdAt =
    new Date(task.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }) +
    ", " +
    new Date(task.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    category: task.category ?? "General",
    status: task.status,
    propertyName: task.property_id ? "View Property" : "—",
    propertyId: task.property_id,
    unit: "",
    assigneeName: task.assigned_to ? "Assigned" : "Unassigned",
    assigneeInitials: "—",
    assigneeRole: "",
    supplierName: "—",
    supplierCategory: "—",
    supplierContact: "—",
    supplierPhone: "—",
    supplierEmail: "—",
    dueDate,
    dueDays,
    slaCompliance: 0,
    slaTarget: "95%",
    slaDue: dueDays,
    timeRemaining: dueDays,
    costImpact: `£${costDisplay.toFixed(2)}`,
    costLabel,
    attachments: 0,
    comments: 0,
    description: task.description ?? "No description provided.",
    reportedBy: "—",
    reportedOn: createdAt,
    workType: task.category ?? "General",
    impact: "—",
    accessRequired: "—",
    specialInstructions: "",
    propertyManager: "—",
    propertyType: "—",
    propertyStatus: "—",
    propertyAddress: "—",
    checklist: [],
    linkedRecords: task.property_id
      ? [{ type: "Property", label: "View Property", href: "/app/portfolio" }]
      : [],
    costEstimate: { labour: 0, materials: 0, total: costTotal },
    dependencies: [],
    activity: [
      { id: "created", type: "created", text: "Task created", user: "System", time: createdAt, initials: "SY" },
    ],
    watchers: [],
    mockFiles: [],
  }
}

const TABS = ["Overview", "Checklist", "Activity", "Files", "Linked Work", "Notes", "History"]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function TaskDetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-32 bg-slate-100 rounded" />
      <div className="h-8 w-64 bg-slate-100 rounded" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 h-24" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl h-64" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------
function TaskKpiStrip({ task, setActiveTab }: { task: TaskView; setActiveTab: (tab: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* SLA compliance */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={task.slaCompliance >= 90 ? "#10B981" : task.slaCompliance >= 70 ? "#F59E0B" : "#EF4444"}
              strokeWidth="4"
              strokeDasharray={`${task.slaCompliance * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-700">{task.slaCompliance}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{task.slaCompliance}%</p>
          <p className="text-[11px] text-slate-500">SLA Compliance</p>
          <p className="text-[10px] text-slate-400">Target {task.slaTarget} · Due {task.slaDue}</p>
          <Link href="/app/work/tasks" className="text-[10px] text-[#2563EB] font-medium">Add reminder</Link>
        </div>
      </div>

      {/* Due Date */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Due Date</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.dueDate}</p>
        <p className="text-[11px] text-slate-400">{task.dueDays}</p>
        <Link href="/app/work/tasks" className="text-[10px] text-[#2563EB] font-medium">Add reminder</Link>
      </div>

      {/* Time Remaining */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Time Remaining</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.timeRemaining}</p>
        <p className="text-[11px] text-slate-400">Until due</p>
        <Link href="/app/work/tasks" className="text-[10px] text-[#2563EB] font-medium">View timeline</Link>
      </div>

      {/* Cost Impact */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Cost Impact</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.costImpact}</p>
        <p className="text-[11px] text-slate-400">{task.costLabel}</p>
        <Link href="/app/work/jobs" className="text-[10px] text-[#2563EB] font-medium">View breakdown</Link>
      </div>

      {/* Attachments */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
            <Paperclip className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <p className="text-[11px] text-slate-500">Attachments</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.attachments}</p>
        <p className="text-[11px] text-slate-400">Files attached</p>
        <Link href="/app/work/tasks" className="text-[10px] text-[#2563EB] font-medium">View all</Link>
      </div>

      {/* Comments */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-[11px] text-slate-500">Comments</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.comments}</p>
        <p className="text-[11px] text-slate-400">Total comments</p>
        <button onClick={() => setActiveTab("Activity")} className="text-[10px] text-[#2563EB] font-medium">
          View comments
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab — left content (with inline editing)
// ---------------------------------------------------------------------------
interface OverviewTabLeftProps {
  task: TaskView
  rawTask: Task
  workspaceId: string
  setActiveTab: (tab: string) => void
  onSaveField: (field: keyof UpdateTask, value: string | null) => Promise<void>
}

function OverviewTabLeft({ task, rawTask, setActiveTab, onSaveField }: OverviewTabLeftProps) {
  const completedItems = task.checklist.filter((c) => c.done).length
  const totalItems = task.checklist.length
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Task Description</h3>
        </div>
        <div className="mb-3">
          <InlineEditField
            value={rawTask.description ?? ""}
            type="textarea"
            placeholder="No description provided."
            onSave={(val) => onSaveField("description", val || null)}
            displayClassName="text-sm text-slate-600 whitespace-pre-wrap"
          />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            { label: "Reported By", value: task.reportedBy },
            { label: "Reported On", value: task.reportedOn },
            { label: "Impact", value: task.impact },
            { label: "Access Required", value: task.accessRequired },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{row.label}</p>
              <p className="text-xs text-slate-700 font-medium">{row.value}</p>
            </div>
          ))}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Category</p>
            <InlineEditField
              value={rawTask.category ?? ""}
              type="text"
              placeholder="General"
              onSave={(val) => onSaveField("category", val || null)}
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Due Date</p>
            <InlineEditField
              value={rawTask.due_date ? rawTask.due_date.split("T")[0] : ""}
              type="date"
              placeholder="Not set"
              onSave={(val) => onSaveField("due_date", val || null)}
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Est. Cost (£)</p>
            <InlineEditField
              value={rawTask.estimated_cost ?? ""}
              type="currency"
              prefix="£"
              placeholder="Not set"
              onSave={(val) => onSaveField("estimated_cost", val ? String(parseFloat(val)) : null)}
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Actual Cost (£)</p>
            <InlineEditField
              value={rawTask.actual_cost ?? ""}
              type="currency"
              prefix="£"
              placeholder="Not set"
              onSave={(val) => onSaveField("actual_cost", val ? String(parseFloat(val)) : null)}
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Assigned To</p>
            <InlineEditField
              value={rawTask.assigned_to ?? ""}
              type="text"
              placeholder="Unassigned"
              onSave={(val) => onSaveField("assigned_to", val || null)}
            />
          </div>
        </div>
        {task.specialInstructions && (
          <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-[11px] text-amber-700">
              <span className="font-semibold">Special Instructions:</span> {task.specialInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Checklist */}
      {task.checklist.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Checklist / Subtasks</h3>
            <span className="text-[11px] text-slate-400">{completedItems}/{totalItems} completed</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 mb-3">
            <div className="h-1.5 rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-2.5">
            {task.checklist.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                    item.done ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300"
                  )}
                >
                  {item.done && <CheckSquare className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm", item.done ? "line-through text-slate-400" : "text-slate-700")}>
                    {item.text}
                  </p>
                  {item.assignee && (
                    <p className="text-[10px] text-slate-400">
                      {item.assignee}
                      {item.date ? ` · ${item.date}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 flex items-center gap-1.5 text-[12px] text-[#2563EB] hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
      )}

      {/* Linked Records */}
      {task.linkedRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Linked Records</h3>
          <div className="space-y-2">
            {task.linkedRecords.map((rec) => (
              <div key={rec.label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{rec.type}</p>
                  <p className="text-sm font-medium text-slate-700">{rec.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  {rec.status && (
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {rec.status}
                    </span>
                  )}
                  <Link href={rec.href} className="text-[12px] text-[#2563EB] hover:underline">
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Cost Estimate</h3>
        <div className="space-y-2">
          {[
            { label: "Labour", value: task.costEstimate.labour },
            { label: "Materials", value: task.costEstimate.materials },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{row.label}</p>
              <p className="text-sm font-medium text-slate-700">£{row.value.toFixed(2)}</p>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Total</p>
            <p className="text-sm font-bold text-slate-900">£{task.costEstimate.total.toFixed(2)}</p>
          </div>
        </div>
        <Link href="/app/work/jobs" className="mt-2 text-[12px] text-[#2563EB] hover:underline">
          View cost breakdown →
        </Link>
      </div>

      {/* Notes */}
      <NotesSection rawTask={rawTask} onSaveField={onSaveField} setActiveTab={setActiveTab} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notes section with wired save
// ---------------------------------------------------------------------------
function NotesSection({
  rawTask,
  onSaveField,
  setActiveTab,
}: {
  rawTask: Task
  onSaveField: (field: keyof UpdateTask, value: string | null) => Promise<void>
  setActiveTab: (t: string) => void
}) {
  const [note, setNote] = useState(rawTask.description ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSaveNote() {
    setSaving(true)
    try {
      await onSaveField("description", note || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Notes</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 resize-none"
        rows={3}
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          {[Bold, Italic, Link2, AtSign].map((Icon, i) => (
            <button key={i} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <button
          onClick={handleSaveNote}
          disabled={saving}
          className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5"
        >
          {saving ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            "Saved!"
          ) : (
            "Save Note"
          )}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity tab
// ---------------------------------------------------------------------------
function ActivityTab({ task }: { task: TaskView }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Timeline</h3>
      <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
        {task.activity.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-6 w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.initials}
                </div>
                <p className="text-xs font-semibold text-slate-700">{item.user}</p>
                <p className="text-[10px] text-slate-400">{item.time}</p>
              </div>
              <p className="text-xs text-slate-600">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Files tab
// ---------------------------------------------------------------------------
function FilesTab({ task, workspaceId, taskId }: { task: TaskView; workspaceId?: string; taskId: string }) {
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
      {task.mockFiles.length > 0 && (
        <div className="space-y-2">
          {task.mockFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
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

// ---------------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------------
function RightColumn({
  task,
  rawTask,
  onSaveField,
  setActiveTab,
}: {
  task: TaskView
  rawTask: Task
  onSaveField: (field: keyof UpdateTask, value: string | null) => Promise<void>
  setActiveTab: (tab: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Status + Priority quick-change */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Status &amp; Priority</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Status</p>
            <StatusChangeDropdown
              currentStatus={rawTask.status}
              onChangeStatus={(s) => onSaveField("status", s)}
              type="task"
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Priority</p>
            <InlineEditField
              value={rawTask.priority}
              type="select"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              onSave={(val) => onSaveField("priority", val)}
            />
          </div>
        </div>
      </div>

      {/* Property Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Property Context</h3>
        <div className="w-full h-28 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
          <Home className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-900">{task.propertyName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{task.propertyAddress}</p>
        <div className="mt-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Property ID</p>
          <InlineEditField
            value={rawTask.property_id ?? ""}
            type="text"
            placeholder="No property linked"
            onSave={(val) => onSaveField("property_id", val || null)}
          />
        </div>
        {task.propertyId && (
          <Link href="/app/portfolio" className="mt-3 block text-[12px] text-[#2563EB] hover:underline">
            View Property →
          </Link>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Timeline</h3>
        <div className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
          {task.activity.slice(0, 4).map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-5 w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white" />
              <p className="text-[11px] font-medium text-slate-700">{item.text}</p>
              <p className="text-[10px] text-slate-400">
                {item.user} · {item.time}
              </p>
            </div>
          ))}
        </div>
        <button onClick={() => setActiveTab("Activity")} className="mt-3 text-[12px] text-[#2563EB] hover:underline">
          View full timeline →
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recent activity footer
// ---------------------------------------------------------------------------
function RecentActivityFooter({ task }: { task: TaskView }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="flex gap-4 overflow-x-auto">
        {task.activity.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-3 min-w-[200px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {item.initials}
              </div>
              <p className="text-xs font-semibold text-slate-700">{item.user}</p>
            </div>
            <p className="text-xs text-slate-600">{item.text}</p>
            <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TaskDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const workspaceId = useWorkspaceId()
  const { data: taskData, isLoading, error } = useTask(workspaceId, id)
  const updateTask = useUpdateTask()
  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()
  const [activeTab, setActiveTab] = useState("Overview")
  const [copied, setCopied] = useState(false)
  const [completing, setCompleting] = useState(false)

  if (isLoading) return <TaskDetailSkeleton />

  if (error || taskData === null || taskData === undefined) {
    return (
      <div className="space-y-5">
        <Link href="/app/work/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to Tasks
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="w-10 h-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">Task not found</p>
          <p className="text-sm text-slate-400">This task may have been deleted or you don&apos;t have access.</p>
          <Link href="/app/work/tasks" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8]">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  const task = buildTaskView(taskData)

  function handleCopy() {
    navigator.clipboard.writeText(task.id).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleMarkComplete() {
    if (!workspaceId || completing) return
    setCompleting(true)
    try {
      await completeTask.mutateAsync({ id: task.id, workspaceId })
      router.push("/app/work/tasks")
    } catch {
      setCompleting(false)
    }
  }

  async function saveField(field: keyof UpdateTask, value: string | null) {
    if (!taskData || !workspaceId) return
    await updateTask.mutateAsync({
      id: taskData.id,
      workspaceId,
      payload: { [field]: value } as UpdateTask,
    })
  }

  async function handleDelete() {
    if (!workspaceId) return
    await deleteTask.mutateAsync({ id: task.id, workspaceId })
    router.push("/app/work/tasks")
  }

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/app/work/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to Tasks
      </Link>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Detail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Task workspace and execution detail</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMarkComplete}
            disabled={completing || taskData.status === "done"}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {completing ? "Completing…" : "Complete"}
          </button>
          <button
            onClick={() => router.push(`/app/work/tasks/${task.id}/edit`)}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Users className="w-3.5 h-3.5" /> Reassign
          </button>
          <Link
            href="/app/work"
            className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </Link>
          <ConfirmDeleteDialog
            title="Delete this task?"
            description="This action cannot be undone. The task will be permanently removed."
            onConfirm={handleDelete}
          >
            {(openDialog) => (
              <button
                onClick={openDialog}
                className="h-8 px-3 rounded-lg border border-red-200 bg-white text-[12.5px] text-red-600 flex items-center gap-1.5 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </ConfirmDeleteDialog>
          <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task title card — title is inline-editable */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <WorkPriorityBadge priority={task.priority} showLabel={false} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <InlineEditField
                value={taskData.title}
                type="text"
                onSave={(val) => saveField("title", val)}
                displayClassName="text-xl font-bold text-slate-900"
                className="flex-1"
              />
              <StatusChangeDropdown
                currentStatus={taskData.status}
                onChangeStatus={(s) => saveField("status", s)}
                type="task"
                saving={updateTask.isPending}
              />
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                {task.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {taskData.property_id ? (
                  <Link href="/app/portfolio" className="text-[#2563EB] hover:underline">
                    {task.propertyName}
                  </Link>
                ) : (
                  <span>{task.propertyName}</span>
                )}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                #{task.id.slice(0, 8)}
                <button onClick={handleCopy} className="ml-1 text-slate-300 hover:text-slate-500">
                  {copied ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <TaskKpiStrip task={task} setActiveTab={setActiveTab} />

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center overflow-x-auto border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Overview" && (
            <div className="flex gap-5 items-start">
              <div className="flex-1 min-w-0">
                <OverviewTabLeft
                  task={task}
                  rawTask={taskData}
                  workspaceId={workspaceId ?? ""}
                  setActiveTab={setActiveTab}
                  onSaveField={saveField}
                />
              </div>
              <div className="hidden xl:block w-64 shrink-0">
                <RightColumn
                  task={task}
                  rawTask={taskData}
                  onSaveField={saveField}
                  setActiveTab={setActiveTab}
                />
              </div>
            </div>
          )}
          {activeTab === "Checklist" && (
            <div className="max-w-2xl">
              {task.checklist.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No checklist items yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.checklist.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl">
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                          item.done ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300"
                        )}
                      >
                        {item.done && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", item.done ? "line-through text-slate-400" : "text-slate-700")}>
                          {item.text}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.assignee}
                          {item.date ? ` · ${item.date}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          item.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {item.done ? "Done" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "Activity" && <ActivityTab task={task} />}
          {activeTab === "Files" && <FilesTab task={task} workspaceId={workspaceId} taskId={id} />}
          {activeTab === "Notes" && (
            <div className="max-w-2xl">
              <NotesSection rawTask={taskData} onSaveField={saveField} setActiveTab={setActiveTab} />
            </div>
          )}
          {(activeTab === "Linked Work" || activeTab === "History") && (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">{activeTab} content coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity footer */}
      <RecentActivityFooter task={task} />
    </div>
  )
}
