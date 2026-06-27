"use client"

import React, { useState } from "react"
import { X } from "lucide-react"

const INVITABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Team Member" },
  { value: "read_only", label: "Read-only" },
  { value: "finance", label: "Finance" },
  { value: "compliance", label: "Compliance" },
]

export interface InviteMemberModalProps {
  onClose: () => void
  onInvite: (email: string, role: string) => Promise<void>
  seatLimitReached?: boolean
}

export function InviteMemberModal({ onClose, onInvite, seatLimitReached }: InviteMemberModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError("Email is required"); return }
    setSending(true)
    setError(null)
    try {
      await onInvite(email.trim(), role)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">Invite team member</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {seatLimitReached ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Seat limit reached</p>
            <p className="text-[12.5px] text-slate-500 mt-1">Upgrade your plan to invite more team members.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send invite"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
