/**
 * Z-INDEX SCALE — single source of truth for shell/overlay layering.
 * ------------------------------------------------------------------
 * The app shell uses `backdrop-filter` on the desktop topbar, which establishes
 * a NEW stacking context. Any dropdown rendered *inside* that header is trapped
 * beneath sibling content no matter how high its local z-index is. The fix used
 * across the shell is to PORTAL overlays to `document.body` and give them a
 * value from this scale, so they all compose against the page root instead.
 *
 * Layer order (low → high):
 *   content        — normal page flow
 *   sidebar        — fixed desktop side nav (floats over content)
 *   sticky         — sticky sub-headers / topbars
 *   mobileNav      — fixed mobile bottom/top bars
 *   dropdown       — popovers, menus, switchers (portaled above the topbar)
 *   panel          — side panels (AI Copilot) + their scrim
 *   modal          — modal dialogs / drawers / sheets
 *   commandPalette — ⌘K palette (always on top)
 *   toast          — transient toasts (above everything)
 *
 * Use the numeric constants for inline `style={{ zIndex }}` (portaled overlays),
 * or the `Z` Tailwind-arbitrary helpers for `className`.
 */
export const zIndex = {
  content: 0,
  sidebar: 30,
  sticky: 30,
  mobileNav: 40,
  /** Dropdowns/menus/popovers/the workspace switcher — must clear the topbar. */
  dropdown: 1000,
  /** AI Copilot side panel + its scrim. */
  panel: 1100,
  /** Modal dialogs, drawers, bottom sheets. */
  modal: 1200,
  /** Global ⌘K command palette. */
  commandPalette: 1300,
  /** Transient toasts. */
  toast: 1400,
} as const

export type ZIndexLayer = keyof typeof zIndex

/** Tailwind arbitrary-value class equivalents (for `className`). */
export const Z = {
  sidebar: "z-30",
  sticky: "z-30",
  mobileNav: "z-40",
  dropdown: "z-[1000]",
  panel: "z-[1100]",
  modal: "z-[1200]",
  commandPalette: "z-[1300]",
  toast: "z-[1400]",
} as const
