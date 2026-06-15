"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Self-contained inline-edit toast.

   The inline-editing system must surface save success/failure regardless of
   whether the host page mounts a toast provider. Rather than depend on app
   wiring (there is no global imperative toast hook), this renders a small,
   accessible toast into a singleton portal container appended to <body>.

   - role=status (success) / role=alert (error) for screen readers
   - auto-dismisses; errors linger longer
   - fade/slide respects prefers-reduced-motion (uses globals.css `fadeIn`)
   - Propvora styling: white surface, semantic accent border, navy text
   - SSR-safe: every entry point bails when `document` is undefined
─────────────────────────────────────────────────────────────────────────── */

const CONTAINER_ID = "propvora-inline-edit-toasts"

export interface InlineEditToast {
  variant: "success" | "error"
  message: string
  description?: string
}

function getContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null
  let el = document.getElementById(CONTAINER_ID)
  if (!el) {
    el = document.createElement("div")
    el.id = CONTAINER_ID
    // Lift clear of the fixed mobile bottom nav (≈64px + safe-area) below lg;
    // drop back to the standard 16px offset on lg+ where there is no bottom nav.
    el.setAttribute(
      "style",
      "position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 84px);right:16px;z-index:200;display:flex;flex-direction:column;gap:8px;max-width:360px;pointer-events:none;"
    )
    if (typeof window !== "undefined" && window.matchMedia?.("(min-width: 1024px)").matches) {
      el.style.bottom = "16px"
    }
    document.body.appendChild(el)
  }
  return el
}

export function showInlineEditToast(toast: InlineEditToast) {
  const container = getContainer()
  if (!container) return

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  const accent = toast.variant === "success" ? "#10B981" : "#EF4444"

  const card = document.createElement("div")
  card.setAttribute("role", toast.variant === "error" ? "alert" : "status")
  card.setAttribute("aria-live", toast.variant === "error" ? "assertive" : "polite")
  card.setAttribute(
    "style",
    [
      "pointer-events:auto",
      "display:flex",
      "align-items:flex-start",
      "gap:10px",
      "background:#ffffff",
      `border:1px solid ${accent}33`,
      `border-left:3px solid ${accent}`,
      "border-radius:12px",
      "padding:12px 14px",
      "box-shadow:0 10px 32px rgba(15,23,42,0.14)",
      "font-family:inherit",
      reduceMotion ? "" : "animation:fadeIn 180ms ease-out",
    ].join(";")
  )

  // Icon (inline SVG via lucide markup kept simple with text fallback).
  const icon = document.createElement("span")
  icon.setAttribute("aria-hidden", "true")
  icon.setAttribute(
    "style",
    `flex-shrink:0;margin-top:1px;width:18px;height:18px;color:${accent};`
  )
  icon.innerHTML =
    toast.variant === "success"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`

  const body = document.createElement("div")
  body.setAttribute("style", "flex:1;min-width:0;")

  const title = document.createElement("p")
  title.textContent = toast.message
  title.setAttribute(
    "style",
    "margin:0;font-size:13px;font-weight:600;color:#071B4D;line-height:1.3;"
  )
  body.appendChild(title)

  if (toast.description) {
    const desc = document.createElement("p")
    desc.textContent = toast.description
    desc.setAttribute(
      "style",
      "margin:2px 0 0;font-size:12px;color:#64748b;line-height:1.35;word-break:break-word;"
    )
    body.appendChild(desc)
  }

  const close = document.createElement("button")
  close.setAttribute("type", "button")
  close.setAttribute("aria-label", "Dismiss notification")
  close.setAttribute(
    "style",
    "flex-shrink:0;background:none;border:none;cursor:pointer;color:#94a3b8;padding:2px;border-radius:6px;line-height:0;"
  )
  close.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

  let removed = false
  const remove = () => {
    if (removed) return
    removed = true
    clearTimeout(timer)
    card.remove()
  }
  close.addEventListener("click", remove)

  card.appendChild(icon)
  card.appendChild(body)
  card.appendChild(close)
  container.appendChild(card)

  const timer = setTimeout(remove, toast.variant === "error" ? 6000 : 3000)
}
