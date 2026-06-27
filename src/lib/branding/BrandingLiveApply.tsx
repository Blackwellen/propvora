"use client"

import { useEffect } from "react"
import { brandCssVars, resolveBrand, brandFontHref, type BrandColours } from "./theme"

/** Event name dispatched by the branding settings page on save. */
export const BRANDING_UPDATED_EVENT = "propvora:branding-updated"

export interface BrandingUpdatedDetail {
  brandColor?: string | null
  brandColours?: Partial<BrandColours> | null
}

const BRAND_FONT_LINK_ID = "propvora-brand-font"

/** Apply a palette live to both :root and the brand-root wrapper, and load the brand font. */
function applyToRoot(detail: BrandingUpdatedDetail) {
  const palette = resolveBrand(detail.brandColor ?? null, detail.brandColours ?? null)
  const vars = brandCssVars(palette)
  // Apply to :root AND the inline-styled brand-root wrapper, otherwise the
  // server-rendered inline vars on [data-brand-root] would shadow the new values.
  const targets: HTMLElement[] = [document.documentElement]
  const wrapper = document.querySelector("[data-brand-root]")
  if (wrapper instanceof HTMLElement) targets.push(wrapper)
  for (const el of targets) {
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v)
  }

  // Ensure the chosen Google Font is loaded (inject/replace a single <link>).
  const href = brandFontHref(palette.font)
  const existing = document.getElementById(BRAND_FONT_LINK_ID) as HTMLLinkElement | null
  if (href) {
    if (existing) existing.href = href
    else {
      const link = document.createElement("link")
      link.id = BRAND_FONT_LINK_ID
      link.rel = "stylesheet"
      link.href = href
      document.head.appendChild(link)
    }
  } else if (existing) {
    existing.remove()
  }
}

/**
 * Client listener that re-applies brand variables the instant the user saves a
 * new colour on the branding settings page — no reload needed. Other tabs are
 * covered by the next navigation/refresh (server injection).
 */
export default function BrandingLiveApply() {
  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<BrandingUpdatedDetail>).detail
      if (detail) applyToRoot(detail)
    }
    window.addEventListener(BRANDING_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(BRANDING_UPDATED_EVENT, onUpdate)
  }, [])
  return null
}

/** Helper for callers (settings page) to broadcast a branding change. */
export function broadcastBranding(detail: BrandingUpdatedDetail) {
  window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail }))
}
