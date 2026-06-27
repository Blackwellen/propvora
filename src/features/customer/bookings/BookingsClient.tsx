"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { useCustomerToast } from "../components/toast"
import type { Booking } from "../data/bookings"
import BookingsKpiStrip from "./components/BookingsKpiStrip"
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

function csvCell(v: string | number): string {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportBookingsCsv(rows: Booking[]) {
  const headers = ["Ref", "Property", "Location", "Type", "Check in", "Check out", "Guests", "Status", "Payment", "Total (£)", "Host"]
  const lines = rows.map((b) =>
    [b.ref, b.property, b.location, b.type, b.checkIn, b.checkOut, b.guests, b.status, b.payment, (b.totalPence / 100).toFixed(2), b.host]
      .map(csvCell).join(",")
  )
  const csv = [headers.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `propvora-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function BookingsClient({ initialView = "overview", bookings = [] }: { initialView?: View; bookings?: Booking[] }) {
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
  }, [tab, bookings])

  const selected = bookings.find((b) => b.id === selectedId) ?? rows[0]
  const checkedRows = bookings.filter((b) => checked[b.id])
  const checkedCount = checkedRows.length

  function changeView(v: View) {
    setView(v)
    const q = v === "overview" ? "" : `?view=${v}`
    router.replace(`/customer/bookings${q}`, { scroll: false })
  }

  async function requestCancellations() {
    if (checkedRows.length === 0) return
    toast(`Requesting cancellation for ${checkedRows.length} booking${checkedRows.length === 1 ? "" : "s"}…`, "info")
    let ok = 0
    for (const b of checkedRows) {
      try {
        const res = await fetch("/api/customer/issues", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bookingId: b.id,
            category: "cancellation",
            severity: "normal",
            subject: `Cancellation request — ${b.ref}`,
            detail: `Customer requested to cancel booking ${b.ref} (${b.property}).`,
          }),
        })
        if (res.ok) ok++
      } catch { /* continue */ }
    }
    toast(ok > 0 ? `Cancellation request sent for ${ok} booking${ok === 1 ? "" : "s"}. The host will be in touch.` : "Could not send cancellation requests.", ok > 0 ? "success" : "error")
    if (ok > 0) setChecked({})
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
          onClick={() => { if (rows.length === 0) { toast("No bookings to export.", "info"); return } exportBookingsCsv(rows); toast("Bookings exported.", "success") }}
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
        onBulkMessage={() => router.push("/customer/messages")}
        onBulkDownload={() => { if (checkedRows.length === 0) { toast("Select bookings first.", "info"); return } exportBookingsCsv(checkedRows); toast("Exported selected bookings.", "success") }}
        onBulkCancel={requestCancellations}
        onBulkMore={() => router.push("/customer/help")}
      />

      {/* Content + right rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="min-w-0">
          {view === "table" && <BookingsTableView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} checked={checked} setChecked={setChecked} />}
          {view === "cards" && <BookingsCardsView rows={rows} onSelect={setSelectedId} />}
          {view === "overview" && <BookingsOverviewView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}
          {view === "map" && <BookingsMapView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />}

          {/* Count */}
          <div className="flex items-center justify-between mt-4 text-[12.5px] text-slate-500">
            <span>Showing {rows.length} of {bookings.length} bookings</span>
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
