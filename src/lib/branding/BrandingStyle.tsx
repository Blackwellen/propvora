import { resolveBrand, brandCssVars, type BrandColours } from "./theme"
import BrandingLiveApply from "./BrandingLiveApply"

/**
 * Server Component: injects the workspace brand CSS variables onto a wrapper so
 * the chosen colour is applied on the very first paint (no flash of default
 * blue), then mounts a tiny client listener that re-applies instantly when the
 * branding settings page saves a change (without a full reload).
 *
 * Rendered inside the authed app layout, wrapping the shell, so every /app page
 * inherits `--brand` / `--accent` etc.
 */
export default function BrandingStyle({
  brandColor,
  brandColours,
  children,
}: {
  brandColor: string | null
  brandColours: Partial<BrandColours> | null
  children: React.ReactNode
}) {
  const palette = resolveBrand(brandColor, brandColours)
  const vars = brandCssVars(palette)

  return (
    <div data-brand-root style={vars as React.CSSProperties} className="contents">
      <BrandingLiveApply />
      {children}
    </div>
  )
}
