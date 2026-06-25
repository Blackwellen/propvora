"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import type { Job, Task } from "@/types/database"
import {
  Plus, ArrowUpRight, Wrench, Clock, CheckCircle2, Activity, Eye,
} from "lucide-react"
import { StatusPill, Card, fmtDate, fmt } from "./shared"

export function WorkTab({ jobs, tasks, propertyId }: { jobs: Job[]; tasks: Task[]; propertyId: string }) {
  const router = useRouter()
  const JOB_DONE: string[] = ["complete", "closed", "disputed"]
  const TASK_DONE: string[] = ["done", "cancelled"]
  const openJobs = jobs.filter((j) => !JOB_DONE.includes(j.status))
  const openTasks = tasks.filter((t) => !TASK_DONE.includes(t.status))
  const completedJobs = jobs.filter((j) => j.status === "complete" || j.status === "closed")

  const jobStatusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")

  return (
    <div className="space-y-4">
      {/* KPI strip — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open Jobs", value: String(openJobs.length), sub: "In progress", icon: Wrench, color: "#2563EB" },
          { label: "Open Tasks", value: String(openTasks.length), sub: "To do", icon: Clock, color: "#F59E0B" },
          { label: "Completed Jobs", value: String(completedJobs.length), sub: "All time", icon: CheckCircle2, color: "#10B981" },
          { label: "Total Work Items", value: String(jobs.length + tasks.length), sub: "Jobs + tasks", icon: Activity, color: "#7C3AED" },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${k.color}18` }}>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-500">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Jobs */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[14px] font-bold text-slate-900 min-w-0 truncate">Jobs</p>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/property-manager/work/jobs/new?propertyId=${propertyId}`} className="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} className="shrink-0" /> New Job
            </Link>
            <Link href={`/property-manager/work?property=${propertyId}`} className="shrink-0 whitespace-nowrap text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
              Open Work <ArrowUpRight size={12} className="shrink-0" />
            </Link>
          </div>
        </div>
        {jobs.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Wrench size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No jobs for this property</p>
            <p className="text-[12px] text-slate-500 mt-1">Raise a job to track maintenance and works.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-slate-100" role="list">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  onClick={() => router.push(`/property-manager/work?property=${propertyId}`)}
                  className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench size={13} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-[13px]">{job.title}</p>
                    <p className="text-[11px] text-slate-400">{job.reference ?? "—"} · {fmtDate(job.scheduled_date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusPill status={jobStatusLabel(job.status)} />
                    {job.quoted_amount != null && <p className="text-[11px] font-semibold text-slate-700">{fmt(job.quoted_amount)}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Job", "Reference", "Scheduled", "Status", "Quoted", "Actions"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Wrench size={13} className="text-slate-400" />
                          </div>
                          <span className="font-medium text-slate-800">{job.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{job.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDate(job.scheduled_date)}</td>
                      <td className="px-4 py-3"><StatusPill status={jobStatusLabel(job.status)} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{job.quoted_amount != null ? fmt(job.quoted_amount) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionMenu align="right" items={[
                            { label: "Open in Work", icon: Eye, onClick: () => router.push(`/property-manager/work?property=${propertyId}`) },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Tasks */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[14px] font-bold text-slate-900 min-w-0 truncate">Tasks</p>
          <Link href={`/property-manager/work?property=${propertyId}`} className="shrink-0 whitespace-nowrap text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
            Open Work <ArrowUpRight size={12} className="shrink-0" />
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Clock size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No tasks for this property</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-slate-100" role="list">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock size={13} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-[13px]">{task.title}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{task.priority} priority · Due {fmtDate(task.due_date)}</p>
                  </div>
                  <StatusPill status={task.status.charAt(0).toUpperCase() + task.status.slice(1)} />
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Task", "Priority", "Due", "Status"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{task.priority}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDate(task.due_date)}</td>
                      <td className="px-4 py-3"><StatusPill status={task.status.charAt(0).toUpperCase() + task.status.slice(1)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
