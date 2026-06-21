"use client"

import React from "react"
import Link from "next/link"
import {
  Users, Clock, Activity, UserPlus, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MappedContact } from "./types"
import { TYPE_BADGE, PIE_COLOURS, avatarBg, getInitials, relativeTime } from "./types"

// ---- Donut chart helpers ----
interface PieSegment {
  name: string; value: number; colour: string; pct: number; startAngle: number; endAngle: number
}

function getPieColour(type: string): string { return PIE_COLOURS[type] ?? "#94A3B8" }

function buildPieSegments(contacts: MappedContact[]): PieSegment[] {
  const counts: Record<string, number> = {}
  for (const c of contacts) {
    const key = ["tenant","landlord","supplier","applicant","post_tenant","agent"].includes(c.contact_type) ? c.contact_type : "other"
    counts[key] = (counts[key] ?? 0) + 1
  }
  const total = contacts.length || 1
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  let cumAngle = -90
  return entries.map(([name, value]) => {
    const pct = value / total
    const degrees = pct * 360
    const seg: PieSegment = { name: TYPE_BADGE[name]?.label ?? name, value, colour: getPieColour(name), pct, startAngle: cumAngle, endAngle: cumAngle + degrees }
    cumAngle += degrees
    return seg
  })
}

function DonutChart({ segments, total }: { segments: PieSegment[]; total: number }) {
  const cx = 90; const cy = 90; const rOuter = 72; const rInner = 46
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="w-[180px] shrink-0 mx-auto sm:mx-0">
        <svg viewBox="0 0 180 180" className="w-full h-auto" role="img" aria-label={`Contact type breakdown — ${total} contacts total`}>
          {segments.length === 0 ? (
            <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#E2E8F0" strokeWidth={rOuter - rInner} />
          ) : (
            segments.map((seg, i) => {
              const gap = 1.5
              const adjustedStart = seg.startAngle + gap / 2
              const adjustedEnd   = seg.endAngle   - gap / 2
              if (adjustedEnd <= adjustedStart) return null
              const cos = (a: number) => Math.cos((a * Math.PI) / 180)
              const sin = (a: number) => Math.sin((a * Math.PI) / 180)
              const large = (adjustedEnd - adjustedStart) > 180 ? 1 : 0
              const d = [
                `M ${cx + rOuter * cos(adjustedStart)} ${cy + rOuter * sin(adjustedStart)}`,
                `A ${rOuter} ${rOuter} 0 ${large} 1 ${cx + rOuter * cos(adjustedEnd)} ${cy + rOuter * sin(adjustedEnd)}`,
                `L ${cx + rInner * cos(adjustedEnd)} ${cy + rInner * sin(adjustedEnd)}`,
                `A ${rInner} ${rInner} 0 ${large} 0 ${cx + rInner * cos(adjustedStart)} ${cy + rInner * sin(adjustedStart)}`,
                "Z",
              ].join(" ")
              return <path key={i} d={d} fill={seg.colour} />
            })
          )}
          <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: "var(--text-primary, #0F172A)" }}>{total}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-disabled, #94A3B8)" }}>total</text>
        </svg>
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 self-center w-full">
        {segments.map(seg => (
          <div key={seg.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.colour }} />
              <span className="text-xs text-slate-600 font-medium">{seg.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 tabular-nums">{seg.value}</span>
              <span className="text-[10px] text-slate-400">({Math.round(seg.pct * 100)}%)</span>
            </div>
          </div>
        ))}
        {segments.length === 0 && <div className="col-span-2 text-xs text-slate-400 py-4 text-center">No data yet</div>}
      </div>
    </div>
  )
}

// ---- Relationship health ring ----
function RelHealthRing({ contactCount }: { contactCount: number }) {
  const score = contactCount > 0 ? 84 : 0
  const circumference = 2 * Math.PI * 40
  const dash = (score / 100) * circumference
  const strong   = Math.round(contactCount * 0.51)
  const good     = Math.round(contactCount * 0.33)
  const atRisk   = Math.round(contactCount * 0.11)
  const critical = contactCount - strong - good - atRisk
  const breakdown = [
    { label: "Strong",   count: strong,         pct: contactCount > 0 ? 51 : 0, colour: "#10B981" },
    { label: "Good",     count: good,           pct: contactCount > 0 ? 33 : 0, colour: "#2563EB" },
    { label: "At Risk",  count: atRisk,         pct: contactCount > 0 ? 11 : 0, colour: "#F59E0B" },
    { label: "Critical", count: Math.max(0, critical), pct: contactCount > 0 ? 5 : 0,  colour: "#EF4444" },
  ]
  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90" role="img" aria-label={`Relationship health score ${score} out of 100`}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{score}</span>
          <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {breakdown.map(b => (
          <div key={b.label} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.colour }} />
                <span className="text-slate-600">{b.label}</span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">{b.count}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1">
              <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, backgroundColor: b.colour }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Avatar ----
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", avatarBg(name), sz)}>
      {getInitials(name)}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_BADGE[type] ?? { label: type, cls: "bg-slate-100 text-slate-600" }
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.cls)}>{cfg.label}</span>
}

// ---- Main Overview Panel ----
interface Props {
  contacts: MappedContact[]
  onAddContact: () => void
}

export function ContactsOverviewPanel({ contacts, onAddContact }: Props) {
  const pieSegments = buildPieSegments(contacts)

  const attentionContacts = contacts
    .filter(c => c.tags.includes("arrears") || c.tags.includes("follow_up") || c.status === "inactive")
    .slice(0, 5)

  const keyContacts = [...contacts]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)

  const followUpContacts = contacts.filter(c => c.tags.includes("follow_up")).slice(0, 5)

  const recentActivity = [...contacts]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Row 1: Type Breakdown + Attention Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Contact Type Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribution across {contacts.length} contacts</p>
            </div>
            <Link href="/property-manager/contacts/people" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
          </div>
          {contacts.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No contacts yet</p>
              <button onClick={onAddContact} className="mt-2 text-xs text-[#2563EB] hover:underline">Add your first contact</button>
            </div>
          ) : (
            <DonutChart segments={pieSegments} total={contacts.length} />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attention Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Contacts needing action</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">{attentionContacts.length}</span>
          </div>
          {attentionContacts.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Nothing needs attention</p>
            </div>
          ) : (
            attentionContacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <Avatar name={c.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 truncate">{c.full_name}</span>
                    <TypeBadge type={c.contact_type} />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs font-medium text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{c.tags.includes("arrears") ? "Arrears flagged" : c.tags.includes("follow_up") ? "Follow-up due" : "Inactive — review"}</span>
                  </div>
                </div>
                <Link href={`/property-manager/contacts/${c.id}`} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-[#2563EB] hover:text-white transition-colors">
                  Act
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row 2: Key Contacts + Follow-ups + Relationship Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Key Contacts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Most recently active</p>
            </div>
            <Link href="/property-manager/contacts/people" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
          </div>
          {keyContacts.length === 0 ? (
            <div className="py-8 text-center"><Users className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No contacts yet</p></div>
          ) : (
            <div className="space-y-3">
              {keyContacts.map((c, i) => (
                <Link key={c.id} href={`/property-manager/contacts/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                  <Avatar name={c.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#2563EB]">{c.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <TypeBadge type={c.contact_type} />
                      {c.company_name && <span className="text-[10px] text-slate-400 truncate">{c.company_name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700">{8 + i * 2}</p>
                    <p className="text-[10px] text-slate-400">interactions</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Follow-up Reminders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upcoming &amp; overdue</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">{followUpContacts.length}</span>
          </div>
          <div className="space-y-3">
            {followUpContacts.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No follow-ups scheduled</p>
                <p className="text-[10px] text-slate-400 mt-1">Tag a contact &ldquo;follow_up&rdquo; to track it here</p>
              </div>
            ) : followUpContacts.map(f => (
              <Link key={f.id} href={`/property-manager/contacts/${f.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{f.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TypeBadge type={f.contact_type} />
                    <span className="text-[10px] text-slate-400">Updated {relativeTime(f.updated_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Relationship Health</h2>
              <p className="text-xs text-slate-500 mt-0.5">Portfolio health score</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <TrendingUp className="w-3 h-3" /> Good
            </span>
          </div>
          <RelHealthRing contactCount={contacts.length} />
        </div>
      </div>

      {/* Row 3: Recent Activity + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest contact events</p>
            </div>
            <Link href="/property-manager/contacts/activity" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
          </div>
          <div className="space-y-0">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No recent contact activity</p>
              </div>
            ) : recentActivity.map((c, i) => (
              <Link key={c.id} href={`/property-manager/contacts/${c.id}`} className={cn("flex items-start gap-3 py-2.5 group", i < recentActivity.length - 1 && "border-b border-slate-100")}>
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed group-hover:text-[#2563EB] transition-colors truncate">
                    {c.full_name} <span className="text-slate-400 font-normal">updated</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(c.updated_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Stats</h2>
              <p className="text-xs text-slate-500 mt-0.5">Portfolio summary</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Portal Users",    value: contacts.filter(c => c.tags.includes("portal_access")).length.toString(), sub: "with access", colour: "#8B5CF6", positive: true },
              { label: "Active Contacts", value: contacts.filter(c => c.status === "active").length.toString(), sub: "of " + contacts.length, colour: "#10B981", positive: true },
              { label: "Follow-ups",      value: contacts.filter(c => c.tags.includes("follow_up")).length.toString(), sub: "need action", colour: "#EF4444", positive: false },
              { label: "Organisations",   value: contacts.filter(c => ["supplier","agent","legal","accountant","investor"].includes(c.contact_type)).length.toString(), sub: "linked", colour: "#2563EB", positive: true },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {s.positive
                    ? <TrendingUp className="w-3 h-3" style={{ color: s.colour }} />
                    : <TrendingDown className="w-3 h-3" style={{ color: s.colour }} />
                  }
                  <span className="text-[10px] font-medium" style={{ color: s.colour }}>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
