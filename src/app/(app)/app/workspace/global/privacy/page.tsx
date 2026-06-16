"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Plus, Loader2, Clock } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import type { PrivacyRequest } from "@/lib/privacy/dsar"

const TYPES = ["access", "erasure", "rectification", "portability", "objection", "restriction"] as const

function statusBadge(s: string) {
  if (s === "fulfilled") return <Badge variant="success" size="sm" dot>Fulfilled</Badge>
  if (s === "refused") return <Badge variant="danger" size="sm" dot>Refused</Badge>
  if (s === "withdrawn") return <Badge variant="outline" size="sm">Withdrawn</Badge>
  if (s === "in_progress" || s === "extended") return <Badge variant="warning" size="sm" dot>In progress</Badge>
  return <Badge variant="primary" size="sm" dot>{s}</Badge>
}

export default function WorkspacePrivacyPage() {
  const { workspace } = useWorkspace()
  const [requests, setRequests] = useState<PrivacyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [type, setType] = useState<(typeof TYPES)[number]>("access")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  async function load() {
    if (!workspace?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/workspace/privacy-requests?workspaceId=${workspace.id}`)
      const d = await res.json()
      setRequests(d.requests ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id])

  async function create() {
    if (!workspace?.id) return
    setCreating(true)
    try {
      await fetch("/api/workspace/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          requestType: type,
          subjectName: name || undefined,
          subjectEmail: email || undefined,
        }),
      })
      setName("")
      setEmail("")
      await load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/workspace/global"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Global &amp; internationalisation
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" /> Data subject requests
        </h1>
        <p className="text-sm text-slate-500">
          Log and track privacy (DSAR) requests. The response due date is computed from your
          workspace’s privacy regime. For unreviewed countries a conservative clock is used and the
          regime is general information only.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-[14px] font-bold text-slate-900 mb-4">Log a request</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 capitalize"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject name"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px]"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Subject email"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px]"
          />
          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Log request
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">Open & recent requests</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-[12.5px] text-slate-500">No requests logged yet.</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {requests.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 capitalize">
                    {r.requestType} · {r.subjectName ?? r.subjectEmail ?? "Unknown subject"}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Received {new Date(r.receivedAt).toLocaleDateString("en-GB")}
                    {r.dueAt && ` · due ${new Date(r.dueAt).toLocaleDateString("en-GB")}`}
                    {r.regime && ` · ${r.regime}`}
                  </p>
                </div>
                {statusBadge(r.status)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
