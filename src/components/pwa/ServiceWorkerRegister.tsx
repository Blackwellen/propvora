"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

// Registers the service worker and surfaces an "update available" prompt when a
// new version is waiting. Production-only. The SW (public/sw.js) is network-first
// and never caches authed/API responses.
export default function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    let reg: ServiceWorkerRegistration | null = null

    const onLoad = async () => {
      try {
        reg = await navigator.serviceWorker.register("/sw.js")

        // A new SW is already waiting (page loaded after an update was downloaded).
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting)

        reg.addEventListener("updatefound", () => {
          const installing = reg!.installing
          if (!installing) return
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(installing)
            }
          })
        })

        // Reload once the new SW takes control.
        let refreshing = false
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      } catch {
        /* registration failure is non-fatal */
      }
    }

    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])

  function applyUpdate() {
    waiting?.postMessage("SKIP_WAITING")
  }

  if (!waiting) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] pwa-safe-bottom">
      <div className="flex items-center gap-3 rounded-2xl bg-[#0D1B2A] text-white shadow-2xl px-4 py-3">
        <RefreshCw className="w-4 h-4 text-violet-300" />
        <span className="text-sm">A new version of Propvora is available.</span>
        <button onClick={applyUpdate} className="rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white text-xs font-semibold px-3 py-1.5">
          Refresh
        </button>
      </div>
    </div>
  )
}
