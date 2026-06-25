"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { Paperclip, Send, Building2, User, CheckSquare, FileCheck2, AtSign, DoorOpen, KeyRound, Wrench, FileText, Receipt, ShieldCheck, CalendarClock, Bell, Zap, ClipboardList, PiggyBank } from "lucide-react"
import SlashCommandPalette from "./SlashCommandPalette"
import { useWorkspace } from "@/providers/AuthProvider"
import type { CopilotPageContext } from "../context/useCopilotPageContext"

interface Entity { type: string; id: string; label: string }

interface CopilotChatInputProps {
  context: CopilotPageContext
  onSend: (message: string, mentions?: Entity[]) => void
  placeholder?: string
}
const ENTITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  property: Building2, unit: DoorOpen, tenancy: KeyRound, contact: User,
  task: CheckSquare, job: Wrench, compliance: FileCheck2, invoice: FileText,
  bill: Receipt, deposit: PiggyBank, ppm: ShieldCheck, event: CalendarClock,
  reminder: Bell, automation: Zap, planningSet: ClipboardList,
}
const ENTITY_GROUP_LABEL: Record<string, string> = {
  property: "Properties", unit: "Units", tenancy: "Tenancies", contact: "Contacts",
  task: "Tasks", job: "Jobs", compliance: "Compliance", invoice: "Invoices",
  bill: "Bills", deposit: "Deposits", ppm: "PPM plans", event: "Calendar events",
  reminder: "Reminders", automation: "Automations", planningSet: "Planning sets",
}
const ENTITY_GROUP_ORDER = [
  "property", "unit", "tenancy", "contact", "task", "job", "compliance",
  "invoice", "bill", "deposit", "ppm", "event", "reminder", "automation", "planningSet",
]
// Type-filter words that keep the @-picker open across a following space
// (so "@property kingsway" narrows by type then searches "kingsway"). Must mirror
// the alias map in /api/ai/entities so the client and server agree.
const MENTION_TYPE_WORDS = new Set([
  "property", "properties", "prop", "unit", "units", "room", "flat",
  "tenancy", "tenancies", "tenant", "tenants", "lease", "let",
  "contact", "contacts", "person", "people", "landlord", "owner", "supplier", "organisation", "organization", "company",
  "task", "tasks", "todo", "job", "jobs", "repair", "workorder",
  "compliance", "cert", "certificate", "certificates", "safety", "inspection", "gas", "epc", "eicr",
  "invoice", "invoices", "inv", "bill", "bills", "expense", "expenses",
  "deposit", "deposits", "ppm", "maintenance", "planned", "schedule",
  "event", "events", "appointment", "calendar", "reminder", "reminders",
  "automation", "automations", "flow", "recipe", "workflow",
  "planningset", "planning", "appraisal", "deal",
])

export default function CopilotChatInput({
  context,
  onSend,
  placeholder = "Ask Copilot about this page, @mention a record, or type / for actions...",
}: CopilotChatInputProps) {
  const { workspace } = useWorkspace()
  const [value, setValue] = useState("")
  const [showPalette, setShowPalette] = useState(false)
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [picked, setPicked] = useState<Entity[]>([]) // records inserted via @-mention
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function fetchEntities(q: string) {
    if (!workspace?.id) return
    try {
      const res = await fetch(`/api/ai/entities?workspaceId=${workspace.id}&q=${encodeURIComponent(q)}`, { credentials: "include" })
      const data = await res.json()
      setEntities(data.entities ?? [])
    } catch {
      setEntities([])
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target
    const v = el.value
    setValue(v)
    setShowPalette(v.startsWith("/"))
    // @-mention detection: an "@word" being typed (no space) before the caret.
    const caret = el.selectionStart ?? v.length
    const upto = v.slice(0, caret)
    // "@word" with no space, OR "@typeword term" (one space) when the first word
    // is a recognised type filter — so "@property kingsway" stays in the picker.
    const m = upto.match(/@([\w-]{1,30})( [\w-]{0,30})?$/) ?? upto.match(/@()$/)
    const firstWord = (m?.[1] ?? "").toLowerCase()
    const hasSpace = !!m?.[2]
    if (m && !v.startsWith("/") && (!hasSpace || MENTION_TYPE_WORDS.has(firstWord))) {
      const query = `${m[1]}${m[2] ?? ""}`
      setMention({ query, start: caret - m[0].length })
      fetchEntities(query)
    } else {
      setMention(null)
    }
  }

  function selectEntity(ent: Entity) {
    if (!mention) return
    const before = value.slice(0, mention.start)
    const afterCaret = value.slice((inputRef.current?.selectionStart ?? value.length))
    const next = `${before}@${ent.label} ${afterCaret}`
    setValue(next)
    setPicked((prev) => (prev.some((p) => p.id === ent.id && p.type === ent.type) ? prev : [...prev, ent]))
    setMention(null)
    setEntities([])
    inputRef.current?.focus()
  }

  function handleSend() {
    const msg = value.trim()
    if (!msg) return
    // Only send mentions still referenced in the text.
    const active = picked.filter((p) => msg.includes(`@${p.label}`))
    onSend(msg, active.length ? active : undefined)
    setValue("")
    setShowPalette(false)
    setMention(null)
    setEntities([])
    setPicked([])
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.shiftKey && e.metaKey && e.key === "Enter") || (e.ctrlKey && e.key === "Enter")) {
      e.preventDefault()
      handleSend()
      return
    }
    if (e.key === "Escape") {
      if (showPalette) setShowPalette(false)
      if (mention) setMention(null)
    }
  }

  function handleSlashSelect(cmd: string) {
    // Client-only commands (/help, /clear) fire immediately — no need to prefill.
    if (cmd === "/help" || cmd === "/clear") {
      setShowPalette(false)
      setValue("")
      onSend(cmd)
      return
    }
    setValue(cmd + " ")
    setShowPalette(false)
    inputRef.current?.focus()
  }

  function handleSlashButton() {
    setValue("/")
    setShowPalette(true)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      {/* Slash palette */}
      {showPalette && (
        <SlashCommandPalette
          query={value}
          context={context}
          onSelect={handleSlashSelect}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* @-mention entity picker — insert a specific real record, grouped by type */}
      {mention && entities.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-30">
          {ENTITY_GROUP_ORDER.filter((t) => entities.some((e) => e.type === t)).map((type) => {
            const group = entities.filter((e) => e.type === type)
            const GroupIcon = ENTITY_ICON[type] ?? AtSign
            return (
              <div key={type} className="border-b border-slate-50 last:border-b-0">
                <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-[700] uppercase tracking-wide text-slate-400">
                  <GroupIcon className="h-3 w-3 text-slate-400" />
                  {ENTITY_GROUP_LABEL[type] ?? type}
                  <span className="ml-auto font-[600] text-slate-300">{group.length}</span>
                </p>
                {group.map((ent) => {
                  const Icon = ENTITY_ICON[ent.type] ?? AtSign
                  return (
                    <button
                      key={`${ent.type}-${ent.id}`}
                      onMouseDown={(e) => { e.preventDefault(); selectEntity(ent) }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-violet-50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-[600] text-slate-700">{ent.label}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
          <p className="px-3 py-1.5 text-[9.5px] text-slate-300 bg-slate-50/60">Tip: type @ + a type (property, unit, tenancy, contact, job, invoice, bill, deposit, ppm, event, automation…) to filter</p>
        </div>
      )}

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full px-4 pt-3 pb-2 text-[13px] text-slate-800 placeholder-slate-400 resize-none outline-none bg-transparent"
          style={{ minHeight: 40, maxHeight: 120 }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = Math.min(el.scrollHeight, 120) + "px"
          }}
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            {/* Slash button */}
            <button
              onClick={handleSlashButton}
              aria-label="Slash commands"
              title="Slash commands"
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              /
            </button>
            {/* Attach */}
            <button
              aria-label="Attach file"
              title="Attach file"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
            >
              <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ⇧⌘↩ to send
            </span>
            <button
              onClick={handleSend}
              disabled={!value.trim()}
              aria-label="Send message"
              title="Send message"
              className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-slate-400 text-center mt-1.5">
        Context-aware replies only. Type / to run an action.
      </p>
    </div>
  )
}
