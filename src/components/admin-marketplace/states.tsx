import React from "react"
import { Database } from "lucide-react"

/** Honest "table not provisioned" state (schema gap). */
export function NotProvisioned({ table }: { table: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
      <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 font-medium">
        <code className="font-mono text-slate-600">{table}</code> not provisioned
      </p>
      <p className="text-xs text-slate-400 mt-1">
        This part of the marketplace is not present in the database yet.
      </p>
    </div>
  )
}

/** Honest empty state — table exists, no rows match. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType
  title: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
      <Icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
