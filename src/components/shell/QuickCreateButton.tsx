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

const MANAGER_BASE = "/property-manager"

// Every action routes to a real create wizard/page that exists in the app.
const ACTIONS: QuickAction[] = [
  { label: "New property",        href: `${MANAGER_BASE}/portfolio/properties/new`,    icon: Building2,    context: `${MANAGER_BASE}/portfolio` },
  { label: "New tenancy",         href: `${MANAGER_BASE}/portfolio/tenancies/new`,     icon: Home,         context: `${MANAGER_BASE}/portfolio` },
  { label: "New task",            href: `${MANAGER_BASE}/work/tasks/new`,              icon: CheckSquare,  context: `${MANAGER_BASE}/work` },
  { label: "New job",             href: `${MANAGER_BASE}/work/jobs/new`,               icon: Briefcase,    context: `${MANAGER_BASE}/work` },
  { label: "Add income",          href: `${MANAGER_BASE}/money/income?new=1`,          icon: Wallet,       context: `${MANAGER_BASE}/money` },
  { label: "Add expense",         href: `${MANAGER_BASE}/money/expenses?new=1`,        icon: Banknote,     context: `${MANAGER_BASE}/money` },
  { label: "Create invoice",      href: `${MANAGER_BASE}/money/invoices/new`,          icon: FileText,     context: `${MANAGER_BASE}/money` },
  { label: "Add bill",            href: `${MANAGER_BASE}/money/bills/new`,             icon: Receipt,      context: `${MANAGER_BASE}/money` },
  { label: "Add certificate",     href: `${MANAGER_BASE}/compliance/certificates/new`, icon: ShieldCheck,  context: `${MANAGER_BASE}/compliance` },
  { label: "Schedule inspection", href: `${MANAGER_BASE}/compliance/inspections/new`,  icon: ShieldCheck,  context: `${MANAGER_BASE}/compliance` },
  { label: "Create event",        href: `${MANAGER_BASE}/calendar/events/new`,         icon: CalendarPlus, context: `${MANAGER_BASE}/calendar` },
  { label: "Create reminder",     href: `${MANAGER_BASE}/calendar/reminders/new`,      icon: Bell,         context: `${MANAGER_BASE}/calendar` },
  { label: "Add contact",         href: `${MANAGER_BASE}/contacts?new=1`,              icon: Users,        context: `${MANAGER_BASE}/contacts` },
  { label: "Grant portal access", href: `${MANAGER_BASE}/portals?new=1`,               icon: Users,        context: `${MANAGER_BASE}/portals` },
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
          role="menu"
          aria-label="Create new"
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999, width: "min(264px, calc(100vw - 16px))" }}
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
        className="flex items-center gap-2 h-[44px] px-4 sm:px-5 rounded-2xl bg-[var(--brand)] text-white text-[13.5px] font-semibold hover:bg-[var(--brand-strong)] active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.30)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)] motion-reduce:active:scale-100"
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
      role="menuitem"
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-100"
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", accent ? "bg-[var(--brand-soft)]" : "bg-slate-100")}>
        <Icon className={cn("w-4 h-4", accent ? "text-[var(--brand)]" : "text-slate-500")} />
      </div>
      <span className="text-[13px] font-medium text-slate-700">{action.label}</span>
    </button>
  )
}
