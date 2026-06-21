"use client"

import Link from "next/link"
import { MessagesSquare } from "lucide-react"
import { SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestMessagesTabProps {
  request: PipelineRequest
}

export function RequestMessagesTab({ request: r }: RequestMessagesTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
        <Link href="/supplier/inbox" className="text-xs font-semibold text-blue-600">Open inbox</Link>
      </div>
      {r.messages.length === 0 ? (
        <SupplierEmptyState
          icon={MessagesSquare}
          title="No messages"
          description="Ask the requester a question about this job."
        />
      ) : (
        <ul className="space-y-2.5">
          {r.messages.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="font-semibold text-slate-800">{m.authorName}</span>{" "}
              <span className="text-xs text-slate-400">{m.createdAt ? timeAgo(m.createdAt) : ""}</span>
              <p className="text-slate-600">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </SupplierCard>
  )
}
