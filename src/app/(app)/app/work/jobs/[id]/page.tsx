"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Sparkles,
  MoreHorizontal,
  Building2,
  Truck,
  Hash,
  Copy,
  PoundSterling,
  FileText,
  Download,
  Plus,
  CheckSquare,
  Activity,
  ShieldCheck,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkPriorityBadge } from "@/components/work/WorkPriorityBadge"
import {
  InlineEditField,
  InlineEditSelect,
  InlineEditMoney,
  InlineEditDate,
  InlineEditTextarea,
  InlineEditRelationshipSelect,
  usePropertyOptions,
  useContactOptions,
  useSupplierOptions,
  useMemberOptions,
} from "@/components/editing"
import { StatusChangeDropdown } from "@/components/work/StatusChangeDropdown"
import { ConfirmDeleteDialog } from "@/components/work/ConfirmDeleteDialog"
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { useJob, useUpdateJob, useDeleteJob } from "@/hooks/useJobs"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import type { Job, UpdateJob } from "@/types/database"

// Job lifecycle status options (matches the live `jobs.status` enum).
const JOB_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "scoped", label: "Scoped" },
  { value: "supplier_requested", label: "Supplier Requested" },
  { value: "quote_received", label: "Quote Received" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "invoiced", label: "Invoiced" },
  { value: "closed", label: "Closed" },
  { value: "disputed", label: "Disputed" },
]
const JOB_CATEGORY_OPTIONS = [
  { value: "maintenance", label: "Maintenance" },
  { value: "repairs", label: "Repairs" },
  { value: "compliance", label: "Compliance" },
  { value: "cleaning", label: "Cleaning" },
  { value: "inspection", label: "Inspection" },
  { value: "refurbishment", label: "Refurbishment" },
  { value: "gardening", label: "Gardening" },
  { value: "general", label: "General" },
]
const JOB_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

// ---------------------------------------------------------------------------
// View model — maps a live Job row to the shape the UI expects
// ---------------------------------------------------------------------------
interface JobView {
  id: string
  icon: string
  title: string
  status: Job["status"]
  jobId: string
  property: string
  propertyId: string | null
  supplier: string
  assignee: string
  assigneeRole: string
  assigneeInitials: string
  scheduleDate: string
  scheduleTime: string
  priority: Job["priority"]
  costEstimate: string
  plannedCost: number
  approvedCost: number
  invoiceStatus: string
  invoiceLabel: string
  slaTarget: string
  slaStatus: string
  supplierResponse: string
  supplierResponseLabel: string
  completionProgress: number
  description: string
  scope: string[]
  checklist: { id: string; text: string; done: boolean }[]
  linkedIssues: { id: string; title: string; status: string }[]
  costBreakdown: { planned: number; labour: number; parts: number; travel: number; taxes: number; total: number }
  supplierName: string
  supplierStatus: string
  supplierContact: string
  supplierEmail: string
  supplierPhone: string
  compliance: { label: string; status: string; expiry?: string; ok: boolean }[]
  schedule: {
    date: string
    time: string
    status: string
    steps: string[]
  }
  documents: { name: string; size: string; date: string; type: string }[]
  recentUpdates: { user: string; initials: string; action: string; time: string }[]
  activity: { user: string; initials: string; text: string; time: string }[]
}

function buildJobView(job: Job): JobView {
  const scheduleDate = job.scheduled_date
    ? new Date(job.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"

  const createdAt = new Date(job.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })

  const plannedCost = job.quoted_amount ?? 0
  const approvedCost = job.approved_amount ?? plannedCost
  const invoicedAmt = job.invoiced_amount ?? 0

  const invoiceStatus = invoicedAmt > 0 ? "Invoiced" : "Pending"
  const invoiceLabel = invoicedAmt > 0 ? `£${invoicedAmt.toFixed(2)} invoiced` : "Awaiting invoice"

  return {
    id: job.id,
    icon: "🔧",
    title: job.title,
    status: job.status,
    jobId: job.reference ?? job.id.slice(0, 8).toUpperCase(),
    property: job.property_id ? "View Property" : "—",
    propertyId: job.property_id,
    supplier: "—",
    assignee: job.assigned_to ? "Assigned" : "Unassigned",
    assigneeRole: "",
    assigneeInitials: "—",
    scheduleDate,
    scheduleTime: "—",
    priority: job.priority,
    costEstimate: `£${plannedCost.toFixed(2)}`,
    plannedCost,
    approvedCost,
    invoiceStatus,
    invoiceLabel,
    slaTarget: scheduleDate,
    slaStatus: job.status === "complete" ? "Complete" : "On track",
    supplierResponse: "—",
    supplierResponseLabel: "—",
    completionProgress: job.status === "complete" ? 100 : job.status === "in_progress" ? 50 : job.status === "scheduled" ? 20 : 0,
    description: job.description ?? "No description provided.",
    scope: [],
    checklist: [],
    linkedIssues: [],
    costBreakdown: {
      planned: plannedCost,
      labour: 0,
      parts: 0,
      travel: 0,
      taxes: 0,
      total: approvedCost,
    },
    supplierName: "—",
    supplierStatus: "—",
    supplierContact: "—",
    supplierEmail: "—",
    supplierPhone: "—",
    compliance: [],
    schedule: {
      date: scheduleDate,
      time: "—",
      status: job.status === "complete" ? "Complete" : "On Schedule",
      steps: [],
    },
    documents: [],
    recentUpdates: [
      { user: "System", initials: "SY", action: `Job created ${createdAt}`, time: createdAt },
    ],
    activity: [
      { user: "System", initials: "SY", text: `Job created ${createdAt}`, time: createdAt },
    ],
  }
}

const JOB_TABS = ["Overview", "Schedule", "Quotes", "Costs", "Documents", "Activity", "Supplier", "Communications", "Notes", "Linked Tasks"]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function JobDetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-32 bg-slate-100 rounded" />
      <div className="h-8 w-64 bg-slate-100 rounded" />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 h-28" />
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
function JobKpiStrip({ job }: { job: JobView }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <PoundSterling className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Planned Cost</p>
        </div>
        <p className="text-xl font-bold text-slate-900">
          {job.plannedCost > 0 ? `£${job.plannedCost.toLocaleString()}` : "—"}
        </p>
        <p className="text-[11px] text-slate-400">Budgeted</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <PoundSterling className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Approved Cost</p>
        </div>
        <p className="text-xl font-bold text-slate-900">
          {job.approvedCost > 0 ? `£${job.approvedCost.toLocaleString()}` : "—"}
        </p>
        <p className="text-[11px] text-slate-400">Authorised</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Invoice Status</p>
        </div>
        <p className="text-lg font-bold text-amber-600">{job.invoiceStatus}</p>
        <p className="text-[11px] text-slate-400">{job.invoiceLabel}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Scheduled</p>
        </div>
        <p className="text-base font-bold text-slate-900">{job.slaTarget}</p>
        <p className="text-[11px] text-emerald-500 font-medium">{job.slaStatus}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-[11px] text-slate-500">Supplier Response</p>
        </div>
        <p className="text-base font-bold text-slate-900">{job.supplierResponse}</p>
        <p className="text-[11px] text-emerald-500 font-medium">{job.supplierResponseLabel}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Completion</p>
        </div>
        <p className="text-xl font-bold text-slate-900">{job.completionProgress}%</p>
        <div className="mt-1 w-full h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${job.completionProgress}%` }} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview tab content — wired with inline editing
// ---------------------------------------------------------------------------
interface JobRelationshipOptions {
  properties: { value: string; label: string; sublabel?: string }[]
  contacts: { value: string; label: string; sublabel?: string }[]
  suppliers: { value: string; label: string; sublabel?: string }[]
  members: { value: string; label: string; sublabel?: string }[]
}

interface OverviewTabProps {
  job: JobView
  rawJob: Job
  onSave: (field: keyof UpdateJob, value: string | number | null) => Promise<void>
  options: JobRelationshipOptions
}

function OverviewTab({ job, rawJob, onSave, options }: OverviewTabProps) {
  const completedItems = job.checklist.filter(c => c.done).length
  const totalItems = job.checklist.length
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className="flex gap-5 items-start">
      {/* Left main */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Description + Scope */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Job Description</h3>
          </div>
          <InlineEditTextarea
            value={rawJob.description ?? ""}
            label="job description"
            placeholder="No description provided."
            onSave={(val) => onSave("description", val || null)}
            displayClassName="text-sm text-slate-600 whitespace-pre-wrap"
          />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Category</p>
              <InlineEditSelect
                value={rawJob.category ?? ""}
                label="category"
                options={JOB_CATEGORY_OPTIONS}
                placeholder="General"
                onSave={(val) => onSave("category", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Scheduled Date</p>
              <InlineEditDate
                value={rawJob.scheduled_date ? rawJob.scheduled_date.split("T")[0] : ""}
                label="scheduled date"
                placeholder="Not set"
                onSave={(val) => onSave("scheduled_date", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Quoted Amount (£)</p>
              <InlineEditMoney
                value={rawJob.quoted_amount ?? ""}
                label="quoted amount"
                placeholder="Not set"
                onSave={(val) => onSave("quoted_amount", val ? parseFloat(val) : null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Approved Amount (£)</p>
              <InlineEditMoney
                value={rawJob.approved_amount ?? ""}
                label="approved amount"
                placeholder="Not set"
                onSave={(val) => onSave("approved_amount", val ? parseFloat(val) : null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Assigned To</p>
              <InlineEditRelationshipSelect
                value={rawJob.assigned_to ?? ""}
                label="assignee"
                options={options.members}
                placeholder="Unassigned"
                clearable
                onSave={(val) => onSave("assigned_to", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Reference</p>
              <InlineEditField
                value={rawJob.reference ?? ""}
                type="text"
                label="reference"
                placeholder="—"
                onSave={(val) => onSave("reference", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Completed Date</p>
              <InlineEditDate
                value={rawJob.completed_date ? rawJob.completed_date.split("T")[0] : ""}
                label="completed date"
                placeholder="Not completed"
                onSave={(val) => onSave("completed_date", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Property</p>
              <InlineEditRelationshipSelect
                value={rawJob.property_id ?? ""}
                label="property"
                options={options.properties}
                placeholder="No property linked"
                clearable
                onSave={(val) => onSave("property_id", val || null)}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Contact</p>
              <InlineEditRelationshipSelect
                value={rawJob.contact_id ?? ""}
                label="contact"
                options={options.contacts}
                placeholder="No contact linked"
                clearable
                onSave={(val) => onSave("contact_id", val || null)}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        {job.checklist.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Job Checklist</h3>
              <span className="text-[11px] text-slate-400">{completedItems} of {totalItems} completed</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 mb-3">
              <div className="h-1.5 rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-2.5">
              {job.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                    item.done ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300"
                  )}>
                    {item.done && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <p className={cn("text-sm flex-1", item.done ? "line-through text-slate-400" : "text-slate-700")}>{item.text}</p>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", item.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                    {item.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Issues */}
        {job.linkedIssues.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Linked Issues</h3>
              <button className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline">
                <Plus className="w-3 h-3" /> Link Issue
              </button>
            </div>
            <div className="space-y-2">
              {job.linkedIssues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">{issue.id}</p>
                    <p className="text-sm text-slate-700">{issue.title}</p>
                  </div>
                  <span className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    issue.status === "Open" ? "bg-blue-50 text-blue-700" :
                    issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700" :
                    "bg-amber-50 text-amber-700"
                  )}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Schedule Summary</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{job.schedule.status}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium">{job.schedule.date}</p>
          <p className="text-xs text-slate-400 mb-3">{job.schedule.time}</p>
          {job.schedule.steps.length > 0 && (
            <div className="space-y-2">
              {job.schedule.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Details */}
        {job.supplierName !== "—" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Supplier Details</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                {job.supplierName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{job.supplierName}</p>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{job.supplierStatus}</span>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              <p className="text-xs font-medium text-slate-700">{job.supplierContact}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="w-3 h-3" />{job.supplierEmail}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3" />{job.supplierPhone}
              </div>
            </div>
            {job.compliance.length > 0 && (
              <div className="space-y-2">
                {job.compliance.map(c => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={cn("w-3.5 h-3.5", c.ok ? "text-emerald-500" : "text-red-500")} />
                      <p className="text-xs text-slate-600">{c.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-400">{c.expiry}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/app/work/suppliers" className="mt-3 text-[12px] text-[#2563EB] hover:underline">View Supplier →</Link>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Cost Breakdown</h3>
          </div>
          <table className="w-full">
            <tbody>
              {[
                { label: "Planned", value: job.costBreakdown.planned },
                { label: "Labour", value: job.costBreakdown.labour },
                { label: "Parts & Materials", value: job.costBreakdown.parts },
                { label: "Travel", value: job.costBreakdown.travel },
                { label: "VAT / Taxes", value: job.costBreakdown.taxes },
              ].map(row => (
                <tr key={row.label} className="border-b border-slate-50">
                  <td className="py-1.5 text-sm text-slate-600">{row.label}</td>
                  <td className="py-1.5 text-sm font-medium text-slate-700 text-right">
                    {row.value > 0 ? `£${row.value.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 text-sm font-bold text-slate-900">Total inc. VAT</td>
                <td className="py-2 text-sm font-bold text-slate-900 text-right">
                  {job.costBreakdown.total > 0 ? `£${job.costBreakdown.total.toLocaleString()}` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
            <button className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline">
              <Plus className="w-3 h-3" /> Upload
            </button>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center mb-3">
            <p className="text-xs text-slate-400">Drop files here or click to upload</p>
          </div>
          {job.documents.length > 0 && (
            <div className="space-y-2">
              {job.documents.map(doc => (
                <div key={doc.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                      <p className="text-[11px] text-slate-400">{doc.size} · {doc.date}</p>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity & Comments */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Activity &amp; Comments</h3>
            <button className="text-[11px] text-slate-400 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">All Updates</button>
          </div>
          {job.activity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {item.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-700">{item.user}</p>
                  <p className="text-[10px] text-slate-400">{item.time}</p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
            <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold">Post</button>
          </div>
        </div>
      </div>

      {/* Right mini-column */}
      <div className="hidden xl:flex flex-col gap-4 w-64 shrink-0">
        {/* Recent updates */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Updates</h3>
          <div className="space-y-3">
            {job.recentUpdates.map((u, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                  {u.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700">{u.user}</p>
                  <p className="text-[10px] text-slate-500">{u.action}</p>
                  <p className="text-[10px] text-slate-400">{u.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents summary */}
        {job.documents.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Documents</h3>
            <div className="space-y-2">
              {job.documents.map(doc => (
                <div key={doc.name} className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]">{doc.name}</p>
                    <p className="text-[10px] text-slate-400">{doc.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notes tab — wired save
// ---------------------------------------------------------------------------
function NotesTab({ rawJob, onSave }: { rawJob: Job; onSave: (field: keyof UpdateJob, value: string | null) => Promise<void> }) {
  const [note, setNote] = useState(rawJob.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave("notes", note || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Internal Notes</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note... Use @ to mention someone"
        className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 resize-none"
        rows={4}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSave}
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
// Main page
// ---------------------------------------------------------------------------
export default function JobDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const workspaceId = useWorkspaceId()
  const { data: jobData, isLoading, error } = useJob(workspaceId, id)
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()
  const [activeTab, setActiveTab] = useState("Overview")
  const [copied, setCopied] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Relationship option sources (workspace-scoped, RLS, 42P01-safe).
  const propertyOptions = usePropertyOptions(workspaceId)
  const contactOptions = useContactOptions(workspaceId)
  const supplierOptions = useSupplierOptions(workspaceId)
  const memberOptions = useMemberOptions(workspaceId)
  const relationshipOptions: JobRelationshipOptions = {
    properties: propertyOptions,
    contacts: contactOptions,
    suppliers: supplierOptions,
    members: memberOptions,
  }

  if (isLoading) return <JobDetailSkeleton />

  if (error || jobData === null || jobData === undefined) {
    return (
      <div className="space-y-5">
        <Link href="/app/work/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="w-10 h-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">Job not found</p>
          <p className="text-sm text-slate-400">This job may have been deleted or you don&apos;t have access.</p>
          <Link href="/app/work/jobs" className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8]">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const job = buildJobView(jobData)

  function handleCopy() {
    navigator.clipboard.writeText(job.jobId).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleMarkComplete() {
    if (!workspaceId || completing) return
    setCompleting(true)
    try {
      await updateJob.mutateAsync({ id: job.id, workspaceId, payload: { status: "complete" } })
      router.push("/app/work/jobs")
    } catch {
      setCompleting(false)
    }
  }

  async function save(field: keyof UpdateJob, value: string | number | null) {
    if (!jobData || !workspaceId) return
    await updateJob.mutateAsync({
      id: jobData.id,
      workspaceId,
      payload: { [field]: value } as UpdateJob,
    })
  }

  async function handleDelete() {
    if (!workspaceId) return
    await deleteJob.mutateAsync({ id: job.id, workspaceId })
    router.push("/app/work/jobs")
  }

  return (
    <div className="space-y-5">

      {/* Mobile top bar */}
      <MobileTopBar
        title="Job Detail"
        subtitle={jobData.title}
        showBack
        backHref="/app/work/jobs"
        overflowActions={[
          { label: jobData.status === "complete" ? "Completed" : "Mark complete", icon: CheckCircle2, onClick: () => { if (jobData.status !== "complete") handleMarkComplete() } },
          { label: "Reschedule", icon: Calendar, href: "/app/work/ppm" },
          { label: "Request quote", icon: FileText, href: "/app/work/suppliers" },
          { label: "Ask AI", icon: Sparkles, href: "/app/work" },
          { label: "Delete", icon: Trash2, destructive: true, onClick: handleDelete },
        ]}
      />

      {/* Back link */}
      <Link href="/app/work/jobs" className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      {/* Page header */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Detail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Work order execution and supplier delivery</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/app/work/ppm"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Calendar className="w-3.5 h-3.5" /> Reschedule
          </Link>
          <button
            onClick={handleMarkComplete}
            disabled={completing || jobData.status === "complete"}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {completing ? "Saving…" : "Mark Complete"}
          </button>
          <Link
            href="/app/work/suppliers"
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
          >
            Request Quote
          </Link>
          <Link
            href="/app/work"
            className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI
          </Link>
          <ConfirmDeleteDialog
            title="Delete this job?"
            description="This action cannot be undone. The job will be permanently removed."
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

      {/* Hero strip — title and status are inline-editable */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
            {job.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <InlineEditField
                value={jobData.title}
                type="text"
                onSave={(val) => save("title", val)}
                displayClassName="text-xl font-bold text-slate-900"
                className="flex-1"
              />
              <StatusChangeDropdown
                currentStatus={jobData.status}
                onChangeStatus={(s) => save("status", s)}
                type="job"
                saving={updateJob.isPending}
              />
              <div className="flex items-center gap-1.5">
                <WorkPriorityBadge priority={job.priority} showLabel={false} />
                <InlineEditSelect
                  value={jobData.priority}
                  label="priority"
                  options={JOB_PRIORITY_OPTIONS}
                  onSave={(val) => save("priority", val)}
                  displayClassName="text-[12px] font-semibold capitalize"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {job.jobId}
                <button onClick={handleCopy} className="text-slate-300 hover:text-slate-500">
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {job.propertyId ? (
                  <Link href="/app/portfolio" className="text-[#2563EB] hover:underline">{job.property}</Link>
                ) : (
                  <span>{job.property}</span>
                )}
              </span>
              {job.supplier !== "—" && (
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />{job.supplier}
                </span>
              )}
              {job.assignee !== "Unassigned" && (
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">{job.assigneeInitials}</div>
                  {job.assignee}{job.assigneeRole ? ` · ${job.assigneeRole}` : ""}
                </span>
              )}
              {job.scheduleDate !== "—" && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />{job.scheduleDate}
                </span>
              )}
              {job.plannedCost > 0 && (
                <span className="flex items-center gap-1.5">
                  <PoundSterling className="w-3.5 h-3.5" />{job.costEstimate} (ex. VAT)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <JobKpiStrip job={job} />

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="md:hidden p-3 border-b border-slate-100">
          <MobileTabs
            tabs={JOB_TABS.map((t) => ({ id: t, label: t, badge: t === "Linked Tasks" && job.linkedIssues.length > 0 ? job.linkedIssues.length : undefined }))}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="Job sections"
          />
        </div>
        <div className="hidden md:flex items-center overflow-x-auto border-b border-slate-100">
          {JOB_TABS.map(tab => (
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
              {tab === "Linked Tasks" && job.linkedIssues.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                  {job.linkedIssues.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Overview" && (
            <OverviewTab job={job} rawJob={jobData} onSave={save} options={relationshipOptions} />
          )}

          {activeTab === "Schedule" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Job Schedule</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Scheduled Date</p>
                    <InlineEditDate
                      value={jobData.scheduled_date ? jobData.scheduled_date.split("T")[0] : ""}
                      label="scheduled date"
                      placeholder="Not scheduled"
                      onSave={(val) => save("scheduled_date", val || null)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Completed Date</p>
                    <InlineEditDate
                      value={jobData.completed_date ? jobData.completed_date.split("T")[0] : ""}
                      label="completed date"
                      placeholder="Not completed"
                      onSave={(val) => save("completed_date", val || null)}
                    />
                  </div>
                </div>
                {job.schedule.steps.length > 0 && (
                  <div className="space-y-2">
                    {job.schedule.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                        <p className="text-xs text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700">Note: Full scheduling and rescheduling is available via the PPM Scheduler.</p>
                <Link href="/app/work/ppm" className="mt-2 inline-block text-xs font-semibold text-[#2563EB] hover:underline">Open PPM Scheduler →</Link>
              </div>
            </div>
          )}

          {activeTab === "Quotes" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Quotes &amp; Estimates</h3>
                  <Link href="/app/work/suppliers" className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline">
                    <Plus className="w-3 h-3" /> Request Quote
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Quoted Amount</p>
                    <InlineEditMoney
                      value={jobData.quoted_amount ?? ""}
                      label="quoted amount"
                      placeholder="Not set"
                      onSave={(val) => save("quoted_amount", val ? parseFloat(val) : null)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Approved Amount</p>
                    <InlineEditMoney
                      value={jobData.approved_amount ?? ""}
                      label="approved amount"
                      placeholder="Not set"
                      onSave={(val) => save("approved_amount", val ? parseFloat(val) : null)}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Seek independent advice before accepting quotes above your authorised limit.</p>
              </div>
            </div>
          )}

          {activeTab === "Supplier" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Supplier Assignment</h3>
                <div className="mb-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Supplier</p>
                  <InlineEditRelationshipSelect
                    value={jobData.supplier_contact_id ?? ""}
                    label="supplier"
                    options={relationshipOptions.suppliers}
                    placeholder="No supplier assigned"
                    clearable
                    onSave={(val) => save("supplier_contact_id", val || null)}
                  />
                </div>
                {job.supplierName !== "—" ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {job.supplierName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{job.supplierName}</p>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{job.supplierStatus}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <p className="text-xs font-medium text-slate-700">{job.supplierContact}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3 h-3" />{job.supplierEmail}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3" />{job.supplierPhone}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No supplier assigned to this job.</p>
                )}
                <Link href="/app/work/suppliers" className="mt-3 block text-[12px] text-[#2563EB] hover:underline">Browse Suppliers →</Link>
              </div>
            </div>
          )}

          {activeTab === "Costs" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Cost Breakdown</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Quoted Amount</p>
                    <InlineEditMoney
                      value={jobData.quoted_amount ?? ""}
                      label="quoted amount"
                      placeholder="Not set"
                      onSave={(val) => save("quoted_amount", val ? parseFloat(val) : null)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Approved Amount</p>
                    <InlineEditMoney
                      value={jobData.approved_amount ?? ""}
                      label="approved amount"
                      placeholder="Not set"
                      onSave={(val) => save("approved_amount", val ? parseFloat(val) : null)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Invoiced Amount</p>
                    <InlineEditMoney
                      value={jobData.invoiced_amount ?? ""}
                      label="invoiced amount"
                      placeholder="Not invoiced"
                      onSave={(val) => save("invoiced_amount", val ? parseFloat(val) : null)}
                    />
                  </div>
                </div>
                <table className="w-full">
                  <tbody>
                    {[
                      { label: "Planned", value: job.costBreakdown.planned },
                      { label: "Labour", value: job.costBreakdown.labour },
                      { label: "Parts & Materials", value: job.costBreakdown.parts },
                      { label: "Travel", value: job.costBreakdown.travel },
                      { label: "VAT / Taxes", value: job.costBreakdown.taxes },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-slate-50">
                        <td className="py-1.5 text-sm text-slate-600">{row.label}</td>
                        <td className="py-1.5 text-sm font-medium text-slate-700 text-right">
                          {row.value > 0 ? `£${row.value.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 text-sm font-bold text-slate-900">Total inc. VAT</td>
                      <td className="py-2 text-sm font-bold text-slate-900 text-right">
                        {job.costBreakdown.total > 0 ? `£${job.costBreakdown.total.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">Invoice status: <span className="font-semibold text-amber-600">{job.invoiceStatus}</span> — {job.invoiceLabel}</p>
                <p className="text-xs text-slate-400 mt-1">Seek independent legal or financial advice before disputing or withholding payment.</p>
              </div>
            </div>
          )}

          {activeTab === "Documents" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Documents &amp; Evidence</h3>
                <EvidenceUpload
                  workspaceId={workspaceId}
                  folder="job-evidence"
                  table="job_documents"
                  extra={{ job_id: id }}
                  className="mb-3"
                />
                {job.documents.length > 0 && (
                  <div className="space-y-2">
                    {job.documents.map(doc => (
                      <div key={doc.name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                            <p className="text-[11px] text-slate-400">{doc.size} · {doc.date}</p>
                          </div>
                        </div>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Activity" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity &amp; Comments</h3>
              {job.activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-700">{item.user}</p>
                      <p className="text-[10px] text-slate-400">{item.time}</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{item.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold">Post</button>
              </div>
            </div>
          )}

          {activeTab === "Communications" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Communications Log</h3>
                  <button className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline">
                    <Plus className="w-3 h-3" /> Log Communication
                  </button>
                </div>
                <div className="space-y-3">
                  {job.recentUpdates.map((u, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        {u.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{u.user}</p>
                        <p className="text-xs text-slate-600">{u.action}</p>
                        <p className="text-[10px] text-slate-400">{u.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Notes" && (
            <NotesTab rawJob={jobData} onSave={save} />
          )}

          {activeTab === "Linked Tasks" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">{job.linkedIssues.length} tasks linked to this job</p>
                <Link href="/app/work/tasks/new" className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline">
                  <Plus className="w-3 h-3" /> Link Task
                </Link>
              </div>
              {job.linkedIssues.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No tasks linked to this job</p>
                </div>
              ) : (
                job.linkedIssues.map(issue => (
                  <Link key={issue.id} href={`/app/work/tasks/${issue.id}`} className="block p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{issue.id}</p>
                        <p className="text-sm font-medium text-slate-700">{issue.title}</p>
                      </div>
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        issue.status === "Open" ? "bg-blue-50 text-blue-700" :
                        issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700" :
                        "bg-amber-50 text-amber-700"
                      )}>
                        {issue.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
