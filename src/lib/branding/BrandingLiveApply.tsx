"use client"

import { useEffect } from "react"
import { brandCssVars, resolveBrand, type BrandColours } from "./theme"

/** Event name dispatched by the branding settings page on save. */
export const BRANDING_UPDATED_EVENT = "propvora:branding-updated"

export interface BrandingUpdatedDetail {
  brandColor?: string | null
  brandColours?: Partial<BrandColours> | null
}

/** Apply a palette to :root so it overrides the server-rendered wrapper vars. */
function applyToRoot(detail: BrandingUpdatedDetail) {
  const palette = resolveBrand(detail.brandColor ?? null, detail.brandColours ?? null)
  const vars = brandCssVars(palette)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
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
