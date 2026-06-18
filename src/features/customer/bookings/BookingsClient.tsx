"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar, CalendarClock, MessagesSquare, CheckCircle2, PoundSterling, Star, Search,
  LayoutGrid, Table2, Map as MapIcon, Rows3, ChevronRight, ChevronLeft, X, Download,
  MessageSquare, Flag, Upload, Filter, ArrowUpDown, MoreHorizontal, Building2, ExternalLink,
  HelpCircle, LifeBuoy, Users, Star as StarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, bookingStatusTone, paymentTone } from "../components/StatusPill"
import { bookings, bookingKpis, type Booking, type BookingKpi } from "../data/bookings"

type View = "overview" | "cards" | "table" | "map"
type Tab = "all" | "stays" | "lets"

const KPI_ICON: Record<BookingKpi["icon"], typeof Calendar> = {
  calendar: Calendar, calendarClock: CalendarClock, stay: MessagesSquare, check: CheckCircle2, spend: PoundSterling, star: Star,
}
const KPI_BG: Record<BookingKpi["accent"], string> = {
  blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600", slate: "bg-slate-50 text-slate-500",
}

const VIEWS: { id: View; label: string; icon: typeof Rows3 }[] = [
  { id: "overview", label: "Overview", icon: Rows3 },
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table2 },
  { id: "map", label: "Map", icon: MapIcon },
]

export default function BookingsClient({ initialView = "overview" }: { initialView?: View }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [view, setView] = useState<View>(initialView)
  const [tab, setTab] = useState<Tab>("all")
  const [selectedId, setSelectedId] = useState<string>(bookings[0].id)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => {
    if (tab === "stays") return bookings.filter((b) => b.type === "Stay")
    if (tab === "lets") return bookings.filter((b) => b.type === "Let")
    return bookings
  }, [tab])

  const selected = bookings.find((b) => b.id === selectedId) ?? rows[0]
  const checkedCount = Object.values(checked).filter(Boolean).length

  function changeView(v: View) {
    setView(v)
    const q = v === "overview" ? "" : `?view=${v}`
    router.replace(`/customer/bookings${q}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2">
            Bookings
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Manage all your stays and lets in one place.</p>
        </div>
        <button
          onClick={() => toast("Preparing your bookings export…", "info")}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <Upload className="w-4 h-4" /> Export bookings
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {bookingKpis.map((k) => {
          const Icon = KPI_ICON[k.icon]
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", KPI_BG[k.accent])}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs + view switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex items-center gap-1 -mb-px">
          <TabBtn active={tab === "all"} onClick={() => setTab("all")}>All bookings</TabBtn>
          <TabBtn active={tab === "stays"} onClick={() => setTab("stays")}>Stays</TabBtn>
          <TabBtn active={tab === "lets"} onClick={() => setTab("lets")}>Lets</TabBtn>
          <Link href="/customer/bookings/disputes" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
            Disputes <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
          </Link>
          <Link href="/customer/bookings/completed" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">Completed</Link>
        </nav>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-1.5">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = view === v.id
            return (
              <button
                key={v.id}
                onClick={() => changeView(v.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition",
                  active ? "bg-[#0D1B2A] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" /> {v.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search bookings, property or host" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <FilterBtn icon={Building2}>All types</FilterBtn>
        <FilterBtn icon={MapIcon}>All locations</FilterBtn>
        <FilterBtn icon={Calendar}>Any dates</FilterBtn>
        <FilterBtn icon={Filter}>More filters</FilterBtn>
        <button onClick={() => toast("Sorting options — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 ml-auto">
          <ArrowUpDown className="w-4 h-4" /> Sort by: Upcoming
        </button>
      </div>

      {/* Bulk bar (table view) */}
      {view === "table" && (
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-slate-500 font-medium">{checkedCount} selected</span>
          <BulkBtn disabled={!checkedCount} onClick={() => toast("Messaged selected hosts", "success")}>Message</BulkBtn>
          <BulkBtn disabled={!checkedCount} onClick={() => toast("Downloading receipts…", "info")}>Download</BulkBtn>
          <BulkBtn disabled={!checkedCount} onClick={() => toast("Cancellation flow — coming soon", "info")}>Cancel booking</BulkBtn>
          <BulkBtn onClick={() => toast("More actions — coming soon", "info")}>More actions</BulkBtn>
        </div>
      )}

      {/* Content + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="min-w-0">
          {view === "table" && <TableView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} checked={checked} setChecked={setChecked} />}
          {view === "cards" && <CardsView rows={rows} onSelect={setSelectedId} />}
          {view === "overview" && <OverviewView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}
          {view === "map" && <MapView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-[12.5px] text-slate-500">
            <span>Showing 1 to {rows.length} of 24 bookings</span>
            <div className="flex items-center gap-1">
              <PageBtn><ChevronLeft className="w-4 h-4" /></PageBtn>
              <PageBtn active>1</PageBtn><PageBtn>2</PageBtn><PageBtn>3</PageBtn>
              <PageBtn><ChevronRight className="w-4 h-4" /></PageBtn>
            </div>
          </div>
        </div>

        {/* Right rail */}
        {(view === "table" || view === "map") && selected ? (
          <BookingDetailPanel b={selected} onClose={() => setSelectedId("")} toast={toast} />
        ) : (
          <BookingSummaryRail toast={toast} />
        )}
      </div>
    </div>
  )
}

/* ── Views ─────────────────────────────────────────────────────────────── */
function TableView({ rows, selectedId, onSelect, checked, setChecked }: {
  rows: Booking[]; selectedId?: string; onSelect: (id: string) => void
  checked: Record<string, boolean>; setChecked: (fn: (c: Record<string, boolean>) => Record<string, boolean>) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="py-2.5 pl-4 pr-2 w-8"></th>
              <th className="py-2.5 px-2 font-semibold">Booking ID</th>
              <th className="py-2.5 px-2 font-semibold">Property</th>
              <th className="py-2.5 px-2 font-semibold">Type</th>
              <th className="py-2.5 px-2 font-semibold">Dates</th>
              <th className="py-2.5 px-2 font-semibold">Guests</th>
              <th className="py-2.5 px-2 font-semibold">Status</th>
              <th className="py-2.5 px-2 font-semibold">Payment</th>
              <th className="py-2.5 px-2 font-semibold">Host</th>
              <th className="py-2.5 px-2 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((b) => {
              const active = b.id === selectedId
              return (
                <tr
                  key={b.id}
                  onClick={() => onSelect(b.id)}
                  className={cn(
                    "cursor-pointer text-[12.5px] transition-colors",
                    active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={!!checked[b.id]} onChange={() => setChecked((c) => ({ ...c, [b.id]: !c[b.id] }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="py-2.5 px-2"><span className="font-semibold text-blue-600">{b.ref}</span></td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2 min-w-[170px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{b.property}</p><p className="text-slate-400 truncate text-[11.5px]">{b.location}</p></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2"><StatusPill tone={b.type === "Stay" ? "blue" : "amber"}>{b.type}</StatusPill></td>
                  <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{b.dateRange}</td>
                  <td className="py-2.5 px-2 text-slate-600">{b.guests}</td>
                  <td className="py-2.5 px-2"><StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill></td>
                  <td className="py-2.5 px-2"><div><StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill><p className="text-[11px] text-slate-400 mt-0.5">{formatPence(b.totalPence, "GBP")}</p></div></td>
                  <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{b.host}</td>
                  <td className="py-2.5 px-2 text-right"><MoreHorizontal className="w-4 h-4 text-slate-400 inline" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CardsView({ rows, onSelect }: { rows: Booking[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rows.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-2.5 left-2.5"><StatusPill tone={bookingStatusTone(b.status)} className="bg-white/95">{b.status}</StatusPill></div>
          </div>
          <div className="p-4">
            <p className="text-[14px] font-semibold text-slate-900 truncate">{b.property}</p>
            <p className="text-[12.5px] text-slate-500 truncate">{b.location}</p>
            <div className="flex items-center gap-3 mt-2 text-[12px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.dateRange}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.guests}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div><p className="text-[10.5px] text-slate-400">Total paid</p><p className="text-[14px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</p></div>
              <Link href={`/customer/bookings/${b.id}`} onMouseEnter={() => onSelect(b.id)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">
                View booking <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function OverviewView({ rows, selectedId, onSelect }: { rows: Booking[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
      {rows.map((b) => {
        const active = b.id === selectedId
        return (
          <div
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={cn("flex items-center gap-4 p-4 cursor-pointer transition-colors", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500 rounded-xl" : "hover:bg-slate-50")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="w-24 h-18 rounded-xl object-cover shrink-0" style={{ height: "4.5rem" }} />
            <div className="flex-1 min-w-0">
              <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
              <p className="text-[14px] font-semibold text-slate-900 truncate mt-1">{b.property}</p>
              <p className="text-[12.5px] text-slate-500 truncate">{b.location}</p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Booking ref. {b.ref} · {b.guests} guests</p>
            </div>
            <div className="hidden sm:block text-center"><p className="text-[10px] text-slate-400">Check-in</p><p className="text-[12.5px] font-semibold text-slate-700">{b.checkIn}</p></div>
            <div className="hidden sm:block text-center"><p className="text-[10px] text-slate-400">Check-out</p><p className="text-[12.5px] font-semibold text-slate-700">{b.checkOut}</p></div>
            <div className="text-right shrink-0"><p className="text-[15px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</p><p className="text-[11px] text-slate-400">Total</p></div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
        )
      })}
    </div>
  )
}

function MapView({ rows, selectedId, onSelect }: { rows: Booking[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
        {rows.map((b) => {
          const active = b.id === selectedId
          return (
            <button key={b.id} onClick={() => onSelect(b.id)} className={cn("w-full text-left flex gap-3 p-3 transition-colors", active ? "bg-blue-50/50" : "hover:bg-slate-50")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
                <p className="text-[12.5px] font-semibold text-slate-800 truncate mt-1">{b.property}</p>
                <p className="text-[11.5px] text-slate-400 truncate">{b.location}</p>
                <p className="text-[11.5px] text-slate-600 mt-0.5">{formatPence(b.totalPence, "GBP")}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="relative bg-[#E8EEF4] rounded-2xl border border-slate-200 min-h-[420px] overflow-hidden">
        {/* Static map placeholder with markers — TODO(maps): swap for live map */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#dceaf6,transparent_40%),radial-gradient(circle_at_70%_60%,#e3f0e6,transparent_40%)]" />
        {rows.slice(0, 5).map((b, i) => {
          const pos = [["20%", "30%"], ["55%", "20%"], ["45%", "55%"], ["70%", "65%"], ["30%", "75%"]][i]
          const active = b.id === selectedId
          return (
            <button key={b.id} onClick={() => onSelect(b.id)} style={{ left: pos[0], top: pos[1] }} className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-md border-2 border-white",
              active ? "bg-violet-600 text-white scale-110" : "bg-white text-slate-700"
            )}>
              {formatPence(b.totalPence, "GBP")}
            </button>
          )
        })}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 rounded-full px-3 py-1.5 text-[11px] text-slate-500 shadow flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Let</span>
        </div>
      </div>
    </div>
  )
}

/* ── Right rails ───────────────────────────────────────────────────────── */
function BookingDetailPanel({ b, onClose, toast }: { b: Booking; onClose: () => void; toast: (m: string, k?: "success" | "info" | "warning" | "error") => void }) {
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><p className="text-[14px] font-bold text-slate-900">Booking {b.ref}</p><StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill></div>
        <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="relative mt-3 rounded-xl overflow-hidden h-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-[13.5px] font-semibold">{b.property}</p>
          <p className="text-white/80 text-[11.5px] flex items-center gap-1">{b.location}{b.rating && <span className="ml-1 inline-flex items-center gap-0.5"><StarIcon className="w-3 h-3 fill-amber-400 text-amber-400" />{b.rating} ({b.reviews})</span>}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Check-in" value={b.checkIn} />
        <Field label="Check-out" value={b.checkOut} />
        <Field label="Guests" value={`${b.guests} guests`} />
        <Field label="Booking type" value={b.type} />
      </div>

      {b.perNightPence && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[12px] font-semibold text-slate-700 mb-2">Price breakdown</p>
          <Row l={`${formatPence(b.perNightPence, "GBP")} × ${b.nights} nights`} r={formatPence(b.perNightPence * (b.nights ?? 1), "GBP")} />
          {b.cleaningPence ? <Row l="Cleaning fee" r={formatPence(b.cleaningPence, "GBP")} /> : null}
          {b.servicePence ? <Row l="Service fee" r={formatPence(b.servicePence, "GBP")} /> : null}
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total paid</span><span className="text-[13px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</span></div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Payment status</p>
        <div className="flex items-center justify-between"><StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill><button onClick={() => toast("Opening receipt…", "info")} className="text-[12px] font-semibold text-blue-600">View receipt</button></div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Host / Operator</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12.5px] font-semibold text-slate-800">{b.host}</p>{b.superhost && <p className="text-[10.5px] text-amber-600">Superhost</p>}</div></div>
          <button onClick={() => toast(`Messaging ${b.host}…`, "info")} className="text-[12px] font-semibold text-blue-600 border border-slate-200 rounded-lg px-2.5 py-1">Message</button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link href={`/customer/bookings/${b.id}`} className="block text-center bg-[#0D1B2A] hover:bg-[#0b1622] text-white rounded-xl py-2.5 text-[13px] font-semibold">View booking detail</Link>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => toast(`Messaging ${b.host}…`, "info")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message host</button>
          <button onClick={() => toast("Downloading receipt…", "info")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Receipt</button>
        </div>
        <Link href={`/customer/bookings/${b.id}/dispute`} className="flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 rounded-xl py-2 text-[12.5px] font-semibold hover:bg-rose-50"><Flag className="w-4 h-4" /> Open dispute</Link>
      </div>
    </aside>
  )
}

function BookingSummaryRail({ toast }: { toast: (m: string, k?: "success" | "info" | "warning" | "error") => void }) {
  const counts = [
    { l: "Total bookings", v: "8", tone: "blue" as const },
    { l: "Upcoming", v: "2", tone: "violet" as const },
    { l: "Current lets", v: "1", tone: "amber" as const },
    { l: "Completed", v: "5", tone: "emerald" as const },
    { l: "Cancelled", v: "0", tone: "slate" as const },
    { l: "Total spent", v: "£2,865", tone: "blue" as const },
  ]
  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Booking summary</h3><Link href="/customer/bookings?view=overview" className="text-[12px] font-semibold text-blue-600">View all activity</Link></div>
        <ul className="space-y-2.5">
          {counts.map((c) => (
            <li key={c.l} className="flex items-center justify-between"><span className="text-[12.5px] text-slate-500">{c.l}</span><span className="text-[13px] font-bold text-slate-900">{c.v}</span></li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Need help?</h3>
        <ul className="space-y-2">
          <RailLink href="/customer/help" icon={HelpCircle} title="Visit help centre" sub="Find answers to common questions" />
          <RailLink href="/customer/help" icon={LifeBuoy} title="Contact support" sub="Get personalised assistance" />
          <RailLink href="/customer/bookings/disputes" icon={Flag} title="Manage disputes" sub="View and track your disputes" />
        </ul>
      </div>
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0D1B2A]/85" />
        <div className="relative p-4">
          <h3 className="text-white text-[14px] font-bold">Rebook and save</h3>
          <p className="text-white/80 text-[12px] mt-1">Many of your hosts offer returning guest discounts.</p>
          <button onClick={() => toast("Exploring stays…", "info")} className="mt-3 inline-flex items-center gap-1.5 bg-white text-[#0D1B2A] rounded-lg px-3 py-1.5 text-[12.5px] font-semibold">Explore stays <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </aside>
  )
}

/* ── small helpers ─────────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px transition-colors", active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>
      {children}
    </button>
  )
}
function FilterBtn({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Icon className="w-4 h-4 text-slate-400" /> {children}</button>
}
function BulkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-semibold border", disabled ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>{children}</button>
}
function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <button className={cn("min-w-[30px] h-[30px] rounded-lg text-[12.5px] font-semibold inline-flex items-center justify-center", active ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>{children}</button>
}
function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}</p></div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function RailLink({ href, icon: Icon, title, sub }: { href: string; icon: typeof HelpCircle; title: string; sub: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 py-2 group">
        <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><Icon className="w-4 h-4" /></span>
        <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{title}</p><p className="text-[11px] text-slate-500 truncate">{sub}</p></div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </Link>
    </li>
  )
}
