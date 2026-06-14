"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import {
  Plus, ChevronDown, Building2, Home, FileText, Receipt, Briefcase,
  CheckSquare, CalendarPlus, Bell, ShieldCheck, Users, Wallet, Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  label: string
  href: string
  icon: typeof Plus
  /** Route-prefix this action is "contextual" to (sorted to top). */
  context?: string
}

// Every action routes to a real create wizard/page that exists in the app.
const ACTIONS: QuickAction[] = [
  { label: "New property",        href: "/app/portfolio/properties/new",   icon: Building2,    context: "/app/portfolio" },
  { label: "New tenancy",         href: "/app/portfolio/tenancies?new=1",  icon: Home,         context: "/app/portfolio" },
  { label: "New task",            href: "/app/work/tasks/new",             icon: CheckSquare,  context: "/app/work" },
  { label: "New job",             href: "/app/work/jobs/new",              icon: Briefcase,    context: "/app/work" },
  { label: "Add income",          href: "/app/money/income?new=1",         icon: Wallet,       context: "/app/money" },
  { label: "Add expense",         href: "/app/money/expenses?new=1",       icon: Banknote,     context: "/app/money" },
  { label: "Create invoice",      href: "/app/money/invoices/new",         icon: FileText,     context: "/app/money" },
  { label: "Add bill",            href: "/app/money/bills/new",            icon: Receipt,      context: "/app/money" },
  { label: "Add certificate",     href: "/app/compliance/certificates/new", icon: ShieldCheck, context: "/app/compliance" },
  { label: "Schedule inspection", href: "/app/compliance/inspections/new", icon: ShieldCheck,  context: "/app/compliance" },
  { label: "Create event",        href: "/app/calendar/events/new",        icon: CalendarPlus, context: "/app/calendar" },
  { label: "Create reminder",     href: "/app/calendar/reminders/new",     icon: Bell,         context: "/app/calendar" },
  { label: "Add contact",         href: "/app/contacts?new=1",             icon: Users,        context: "/app/contacts" },
  { label: "Grant portal access", href: "/app/portals?new=1",              icon: Users,        context: "/app/portals" },
]

export default function QuickCreateButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
  }, [open])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    if (open) {
      document.addEventListener("mousedown", onClick)
      document.addEventListener("keydown", onKey)
    }
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Contextual actions for the current section float to the top.
  const contextual = ACTIONS.filter((a) => a.context && pathname.startsWith(a.context))
  const rest = ACTIONS.filter((a) => !contextual.includes(a))

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999, width: 264 }}
          className="bg-white rounded-2xl border border-[#E2EAF6] shadow-[0_16px_48px_rgba(15,23,42,0.16)] max-h-[min(70vh,440px)] overflow-y-auto overscroll-contain"
        >
          {contextual.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">On this page</p>
              {contextual.map((a) => (
                <QuickRow key={a.href} action={a} onClick={() => go(a.href)} accent />
              ))}
              <div className="h-px bg-slate-100 my-1" />
            </>
          )}
          <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Create anything</p>
          {rest.map((a) => (
            <QuickRow key={a.href} action={a} onClick={() => go(a.href)} />
          ))}
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Create new"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 h-[44px] px-4 sm:px-5 rounded-2xl bg-[#2563EB] text-white text-[13.5px] font-semibold hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.30)] shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New</span>
        <ChevronDown className={cn("w-3.5 h-3.5 opacity-70 transition-transform", open && "rotate-180")} />
      </button>
      {menu}
    </>
  )
}

function QuickRow({ action, onClick, accent }: { action: QuickAction; onClick: () => void; accent?: boolean }) {
  const Icon = action.icon
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", accent ? "bg-[#EFF6FF]" : "bg-slate-100")}>
        <Icon className={cn("w-4 h-4", accent ? "text-[#2563EB]" : "text-slate-500")} />
      </div>
      <span className="text-[13px] font-medium text-slate-700">{action.label}</span>
    </button>
  )
}
