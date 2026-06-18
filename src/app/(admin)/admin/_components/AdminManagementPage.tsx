import React from "react"
import { Card } from "@/components/ui/Card"

interface AdminManagementPageProps {
  title: string
  description: string
  items: string[]
}

export default function AdminManagementPage({ title, description, items }: AdminManagementPageProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Admin coverage</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-sm font-medium text-slate-800">{item}</p>
              <p className="mt-1 text-xs text-slate-500">Operational controls and audit evidence to wire here.</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
