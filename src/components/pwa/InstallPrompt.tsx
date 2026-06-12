"use client"

import { useEffect, useState } from "react"
import { Download, X, Share } from "lucide-react"

const DISMISS_KEY = "propvora.pwa.installDismissed"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    try { if (localStorage.getItem(DISMISS_KEY) === "1") return } catch { /* ignore */ }

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", onBip)

    // iOS never fires beforeinstallprompt — show manual instructions after a beat.
    let t: ReturnType<typeof setTimeout> | undefined
    if (isIos()) {
      t = setTimeout(() => { setIosHint(true); setShow(true) }, 4000)
    }

    const onInstalled = () => { setShow(false); dismiss() }
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip)
      window.removeEventListener("appinstalled", onInstalled)
      if (t) clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, "1") } catch { /* ignore */ }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    try { await deferred.userChoice } catch { /* ignore */ }
    setDeferred(null)
    dismiss()
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] z-[70] pwa-safe-bottom">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Install Propvora</p>
          {iosHint ? (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Tap <Share className="inline w-3.5 h-3.5 align-text-bottom" /> Share, then <strong>Add to Home Screen</strong> for the full app experience.
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Add Propvora to your home screen for faster access and a full-screen experience.
            </p>
          )}
          {!iosHint && (
            <button onClick={install} className="mt-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5">
              Install app
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
