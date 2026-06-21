"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import type { Booking } from "../data/bookings"
import BookingsKpiStrip from "./components/BookingsKpiStrip"

const bookings: Booking[] = []
import BookingsTabBar from "./components/BookingsTabBar"
import BookingsToolbar from "./components/BookingsToolbar"
import BookingsTableView from "./components/BookingsTableView"
import BookingsCardsView from "./components/BookingsCardsView"
import BookingsOverviewView from "./components/BookingsOverviewView"
import BookingsMapView from "./components/BookingsMapView"
import BookingDetailPanel from "./components/BookingDetailPanel"
import BookingSummaryRail from "./components/BookingSummaryRail"

type View = "overview" | "cards" | "table" | "map"
type Tab = "all" | "stays" | "lets"

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <button className={cn("min-w-[30px] h-[30px] rounded-lg text-[12.5px] font-semibold inline-flex items-center justify-center", active ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>{children}</button>
}

export default function BookingsClient({ initialView = "overview" }: { initialView?: View }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [view, setView] = useState<View>(initialView)
  const [tab, setTab] = useState<Tab>("all")
  const [selectedId, setSelectedId] = useState<string>("")
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
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2">Bookings</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Manage all your stays and lets in one place.</p>
        </div>
        <button
          onClick={() => toast("Preparing your bookings export…", "info")}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <Upload className="w-4 h-4" /> Export bookings
        </button>
      </div>

      <BookingsKpiStrip bookings={bookings} />

      <BookingsTabBar tab={tab} view={view} onTabChange={setTab} onViewChange={changeView} />

      <BookingsToolbar
        checkedCount={checkedCount}
        showBulk={view === "table"}
        onBulkMessage={() => toast("Messaged selected hosts", "success")}
        onBulkDownload={() => toast("Downloading receipts…", "info")}
        onBulkCancel={() => toast("Cancellation flow — coming soon", "info")}
        onBulkMore={() => toast("More actions — coming soon", "info")}
      />

      {/* Content + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="min-w-0">
          {view === "table" && <BookingsTableView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} checked={checked} setChecked={setChecked} />}
          {view === "cards" && <BookingsCardsView rows={rows} onSelect={setSelectedId} />}
          {view === "overview" && <BookingsOverviewView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}
          {view === "map" && <BookingsMapView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-[12.5px] text-slate-500">
            <span>Showing {rows.length} of {bookings.length} bookings</span>
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
