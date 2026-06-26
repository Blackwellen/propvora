/**
 * Workspace branding → CSS-variable theme.
 *
 * A workspace's brand colour (`workspaces.brand_color` and the richer
 * `workspaces.brand_colours` jsonb) is turned into a set of CSS custom
 * properties that the app shell consumes so the chosen colour genuinely drives
 * the primary / accent UI tokens — not just a local preview.
 *
 * The variables produced here are consumed by `globals.css` (e.g. the
 * `bg-brand` / focus-ring rules reference `var(--brand)`) and by the Tailwind
 * `brand` colour scale, so setting a colour re-paints buttons, highlights and
 * focus rings across every page.
 *
 * Pure + isomorphic: safe to call from a Server Component (initial paint, no
 * flash) and from the client (instant apply on save).
 */

export interface BrandColours {
  primary: string
  secondary: string
  accent: string
  background: string
}

/** Propvora defaults — used when a workspace has not set a brand colour. */
export const DEFAULT_BRAND: BrandColours = {
  primary: "#2563EB",
  secondary: "#1D4ED8",
  accent: "#7C3AED",
  background: "#F8FAFC",
}

/**
 * Propvora default asset URLs — used when a workspace has not uploaded its own
 * logos or favicon. Email templates, invoice generators and portal shells should
 * resolve `workspace.email_logo_url ?? PROPVORA_ASSETS.emailLogo` rather than
 * hardcoding a path in each generator.
 */
export const PROPVORA_ASSETS = {
  /** App sidebar + general branding logo */
  logo:        "/propvora-logo-dark.png",
  /** Logo used in outbound email templates */
  emailLogo:   "/propvora-logo-dark.png",
  /** Logo printed on invoices and PDF documents */
  invoiceLogo: "/propvora-logo-dark.png",
  /** 32×32 browser tab favicon */
  favicon:     "/propvora-favicon.png",
} as const

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Validate + normalise a hex colour to 6-digit lowercase, or null if invalid. */
export function normaliseHex(input: unknown): string | null {
  if (typeof input !== "string") return null
  const v = input.trim().toLowerCase()
  if (!HEX_RE.test(v)) return null
  if (v.length === 4) {
    // #abc → #aabbcc
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  }
  return v
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace("#", "")
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const h = (n: number) => clamp(n).toString(16).padStart(2, "0")
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Lighten (amt>0) or darken (amt<0) a hex colour by mixing toward white/black. */
export function shade(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  if (amt >= 0) {
    return toHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt })
  }
  const k = 1 + amt
  return toHex({ r: r * k, g: g * k, b: b * k })
}

/** Relative luminance (WCAG) → pick readable on-colour (white/near-black). */
export function readableOn(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map((c) => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  return L > 0.55 ? "#0F172A" : "#FFFFFF"
}

/**
 * Resolve a workspace's effective brand palette from the two storage shapes:
 * the legacy single `brand_color` and the richer `brand_colours` jsonb. The
 * jsonb wins per-field; the single colour seeds `primary` when jsonb is absent.
 */
export function resolveBrand(
  brandColor: string | null | undefined,
  brandColours: Partial<BrandColours> | null | undefined,
): BrandColours {
  const primaryFromSingle = normaliseHex(brandColor)
  const bc = brandColours ?? {}
  return {
    primary: normaliseHex(bc.primary) ?? primaryFromSingle ?? DEFAULT_BRAND.primary,
    secondary: normaliseHex(bc.secondary) ?? DEFAULT_BRAND.secondary,
    accent: normaliseHex(bc.accent) ?? DEFAULT_BRAND.accent,
    background: normaliseHex(bc.background) ?? DEFAULT_BRAND.background,
  }
}

/**
 * Build the CSS custom-property map from a brand palette. These names are the
 * contract consumed by `globals.css` + Tailwind theme (`--brand`, `--accent`,
 * the `--color-brand-*` scale, focus ring, etc.).
 */
export function brandCssVars(palette: BrandColours): Record<string, string> {
  const { primary, secondary, accent } = palette
  const onPrimary = readableOn(primary)
  const onAccent = readableOn(accent)
  return {
    "--brand": primary,
    "--brand-strong": secondary,
    "--brand-hover": shade(primary, -0.12),
    "--brand-soft": shade(primary, 0.92),
    "--brand-soft-2": shade(primary, 0.85),
    "--on-brand": onPrimary,
    "--accent": accent,
    "--accent-soft": shade(accent, 0.9),
    "--on-accent": onAccent,
    "--ring-focus": `0 0 0 3px ${shade(primary, 0.7)}`,
    "--border-focus": primary,
    // Re-map the Tailwind brand scale so `bg-brand-500`, `text-brand-600`, etc.
    // follow the workspace colour everywhere they're already used.
    "--color-brand-600": shade(primary, -0.12),
    "--color-brand-500": primary,
    "--color-brand-400": shade(primary, 0.18),
    "--color-brand-300": shade(primary, 0.45),
    "--color-brand-100": shade(primary, 0.82),
    "--color-brand-50": shade(primary, 0.92),
  }
}

/** Serialise the brand vars to an inline `style` string for a Server Component. */
export function brandStyleString(palette: BrandColours): string {
  const vars = brandCssVars(palette)
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")
}
