"use client"

import React, { useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { signOffJobAction } from "@/lib/portal/supplier-actions"

interface Props {
  jobId: string
  jobStatus: string
  sessionId: string
}

const ELIGIBLE_STATUSES = ["in_progress", "complete", "approved"]

export default function SignOffButton({ jobId, jobStatus, sessionId }: Props) {
  const [requesting, setRequesting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ELIGIBLE_STATUSES.includes(jobStatus)) return null

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm text-emerald-700">
        <CheckCircle className="w-4 h-4" /> Sign-off requested
      </div>
    )
  }

  async function handleSignOff() {
    setRequesting(true)
    setError(null)
    const res = await signOffJobAction(sessionId, jobId)
    setRequesting(false)
    if (res.ok) setDone(true)
    else setError(res.error)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleSignOff}
        disabled={requesting}
        className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
      >
        {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
        <CheckCircle className="w-4 h-4" />
        {requesting ? "Requesting…" : "Request sign-off"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-[11px] text-slate-400">Mark this job as complete and request operator sign-off.</p>
    </div>
  )
}
