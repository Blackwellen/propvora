"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, AlertCircle, Download, Zap } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { downloadCsv } from '@/lib/export/csv'

interface Props {
  profile: ProfileConfig
}

export default function StarterChecklistTab({ profile }: Props) {
  const { checklist } = profile

  const allTaskIds = checklist.phases.flatMap((phase, phaseIdx) =>
    phase.tasks.map((_, taskIdx) => `${phaseIdx}-${taskIdx}`)
  )

  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set(checklist.phases.map((_, i) => i))
  )

  const wizardHref = `/property-manager/planning/wizard?profile=${profile.slug}`

  /** Real CSV export of the full checklist with live completion status. */
  function handleExport() {
    const rows = checklist.phases.flatMap((phase, phaseIdx) =>
      phase.tasks.map((task, taskIdx) => ({
        phase: phase.name,
        task: task.label,
        priority: task.priority,
        owner: task.owner,
        day: task.daysOffset === 0 ? 'Day 0' : `+${task.daysOffset}d`,
        status: completedTasks.has(`${phaseIdx}-${taskIdx}`) ? 'Complete' : 'Open',
      })),
    )
    downloadCsv(`${profile.slug}-starter-checklist`, rows, [
      { key: 'phase', label: 'Phase' },
      { key: 'task', label: 'Task' },
      { key: 'priority', label: 'Priority' },
      { key: 'owner', label: 'Owner' },
      { key: 'day', label: 'Day' },
      { key: 'status', label: 'Status' },
    ])
  }

  function toggleTask(id: string) {
    setCompletedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePhase(idx: number) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const totalTasks = allTaskIds.length
  const completedCount = completedTasks.size
  const inProgressCount = Math.min(
    checklist.phases.reduce((sum, phase, phaseIdx) => {
      const phaseHasCompleted = phase.tasks.some((_, ti) => completedTasks.has(`${phaseIdx}-${ti}`))
      const phaseAllDone = phase.tasks.every((_, ti) => completedTasks.has(`${phaseIdx}-${ti}`))
      return sum + (phaseHasCompleted && !phaseAllDone ? 1 : 0)
    }, 0),
    totalTasks
  )
  const overallPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  const priorityBadge: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Progress Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Progress Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{inProgressCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: profile.accentColor }}>{overallPct}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Complete</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%`, backgroundColor: profile.accentColor }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{completedCount} of {totalTasks} tasks completed</p>
      </div>

      {/* 2. Phases */}
      {checklist.phases.map((phase, phaseIdx) => {
        const isExpanded = expandedPhases.has(phaseIdx)
        const phaseCompleted = phase.tasks.filter((_, ti) => completedTasks.has(`${phaseIdx}-${ti}`)).length
        return (
          <div key={phaseIdx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phaseIdx)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: profile.accentColor }}
                >
                  {phaseIdx + 1}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{phase.name}</p>
                  <p className="text-xs text-slate-400">
                    {phaseCompleted}/{phase.tasks.length} tasks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {phaseCompleted === phase.tasks.length && phase.tasks.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Complete
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Phase Tasks */}
            {isExpanded && (
              <div className="border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left w-8" />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.tasks.map((task, taskIdx) => {
                      const taskId = `${phaseIdx}-${taskIdx}`
                      const isDone = completedTasks.has(taskId)
                      return (
                        <tr
                          key={taskIdx}
                          className={`border-b border-slate-50 last:border-0 ${isDone ? 'bg-emerald-50/40' : taskIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleTask(taskId)}
                              aria-label={`Mark task complete: ${task.label}`}
                              className="w-4 h-4 rounded cursor-pointer accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-emerald-500/40"
                              style={{ accentColor: profile.accentColor }}
                            />
                          </td>
                          <td className={`px-4 py-3 font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.label}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityBadge[task.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{task.owner}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                            {task.daysOffset === 0 ? 'Day 0' : `+${task.daysOffset}d`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* 3. Critical Path Items */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Critical Path Items</h2>
        <ul className="space-y-3">
          {checklist.criticalPathItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-800">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <Download className="w-4 h-4" />
            Export Checklist (CSV)
          </button>
          <Link
            href={wizardHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ backgroundColor: profile.accentColor }}
          >
            <Zap className="w-4 h-4" />
            Create Planning Set from Here
          </Link>
        </div>
      </div>
    </div>
  )
}
