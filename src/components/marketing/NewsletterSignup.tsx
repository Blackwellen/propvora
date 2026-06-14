"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Mail, Check, Loader2 } from "lucide-react"

// Key-gated Turnstile site key. Supports the task-specified name and the
// existing CF_-prefixed name already in this project's .env.example. The widget
// (and its script) only render when a site key is present.
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY ??
  ""

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js"

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: HTMLElement,
      opts: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void }
    ) => string
    reset: (id?: string) => void
  }
}

type Status = "idle" | "submitting" | "success" | "error"

export default function NewsletterSignup({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  // Load + render the Turnstile widget ONLY when a site key is configured.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || typeof window === "undefined") return

    let cancelled = false

    const renderWidget = () => {
      const w = window as TurnstileWindow
      if (cancelled || !w.turnstile || !widgetRef.current || widgetIdRef.current) return
      widgetIdRef.current = w.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token),
        "error-callback": () => setTurnstileToken(""),
      })
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    )
    if (existing) {
      if ((window as TurnstileWindow).turnstile) renderWidget()
      else existing.addEventListener("load", renderWidget, { once: true })
    } else {
      const script = document.createElement("script")
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.addEventListener("load", renderWidget, { once: true })
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "submitting") return

    if (!consent) {
      setStatus("error")
      setMessage("Please tick the consent box to subscribe.")
      return
    }

    setStatus("submitting")
    setMessage("")

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          consent,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        error?: string
      }

      if (res.ok) {
        setStatus("success")
        setMessage(data.message ?? "Please check your inbox to confirm your subscription.")
        setEmail("")
        setConsent(false)
        // Reset Turnstile so a fresh token is required for any next submit.
        const w = window as TurnstileWindow
        if (w.turnstile && widgetIdRef.current) {
          w.turnstile.reset(widgetIdRef.current)
          setTurnstileToken("")
        }
      } else {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  const submitting = status === "submitting"

  if (status === "success") {
    return (
      <div className={`rounded-2xl border border-blue-100 bg-blue-50/60 p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Almost there</p>
            <p className="mt-1 text-sm text-slate-600" role="status">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`} noValidate>
      <div>
        <label htmlFor="newsletter-email" className="block text-sm font-semibold text-slate-900">
          Get product news &amp; property-ops tips
        </label>
        <p className="mt-1 text-sm text-slate-500">
          Occasional updates from Propvora. No spam, unsubscribe anytime.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="you@company.com"
            aria-label="Email address"
            className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={submitting}
          required
          aria-describedby="newsletter-consent-text"
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500/40"
        />
        <span id="newsletter-consent-text">
          I agree to receive marketing emails from Propvora and accept the{" "}
          <Link href="/legal/privacy" className="font-medium text-blue-600 hover:text-blue-700 underline">
            Privacy Policy
          </Link>
          . I can unsubscribe at any time.
        </span>
      </label>

      {/* Turnstile widget renders only when a site key is configured. */}
      {TURNSTILE_SITE_KEY ? <div ref={widgetRef} className="min-h-[65px]" /> : null}

      {status === "error" && message ? (
        <p className="text-sm text-red-600" role="alert">{message}</p>
      ) : null}
    </form>
  )
}
