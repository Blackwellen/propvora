"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

// Slim banner shown when the browser loses connectivity. Live data depends on a
// connection, so this gives honest feedback rather than silent failures.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    setOffline(!navigator.onLine)
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[90] pt-safe" role="status" aria-live="polite">
      <div className="flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-semibold py-1.5 px-3">
        <WifiOff className="w-3.5 h-3.5" />
        You&apos;re offline — some data may be out of date until you reconnect.
      </div>
    </div>
  )
}
