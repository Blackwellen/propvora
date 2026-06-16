"use client"

import React from "react"
import Link from "next/link"
import { Briefcase, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { EmptyState, StatusChip } from "./shared"

export function WorkHistoryTab({ contact }: { contact: ContactDetail }) {
  const jobs = contact.jobs ?? []
  const totalCost = jobs.reduce((s, j) => s + j.cost, 0)
  if (jobs.length === 0) return <EmptyState icon={Briefcase} message="No jobs linked to this supplier yet." cta="Create Job" />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{jobs.length} jobs · Total spend: <span className="font-semibold text-slate-900">£{totalCost.toLocaleString("en-GB")}</span></p>
        </div>
        <Link href="/app/work/jobs/new">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create Job</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Job","Property","Date","Cost","Status",""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{job.property}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{job.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">£{job.cost}</td>
                <td className="px-4 py-3"><StatusChip status={job.status} /></td>
                <td className="px-4 py-3 text-right"><button className="text-xs text-blue-600 hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
