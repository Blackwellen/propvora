// Pure white-label resolution — safe to import from server components (portals)
// and client code alike. No React, no hooks, no "use client".

export interface WhiteLabelSettings {
  wl_enabled?: boolean
  wl_brand_name?: string
  wl_hide_powered_by?: boolean
  wl_custom_support_email?: string
  wl_custom_login_headline?: string
  wl_portal_custom_name?: string
}

export interface ResolvedWhiteLabel {
  /** True when white-label is enabled on the workspace (Pro/Agency). */
  enabled: boolean
  /** Brand name shown in place of "Propvora" — falls back to workspace name, then "Propvora". */
  brandName: string
  /** When true, the "Powered by Propvora" attribution must be hidden. */
  hidePoweredBy: boolean
  /** Custom support email shown to tenants/landlords, or null. */
  supportEmail: string | null
  /** Portal display name, or null. */
  portalName: string | null
  /** Custom login-screen headline (Enterprise), or null. */
  loginHeadline: string | null
}

const clean = (s?: string | null) => (s && s.trim() ? s.trim() : null)

/**
 * Resolve a white-label config from a raw settings blob + workspace name.
 * White-label fields only take effect when `wl_enabled` is true.
 */
export function resolveWhiteLabel(
  settings: WhiteLabelSettings | null | undefined,
  workspaceName?: string | null,
): ResolvedWhiteLabel {
  const wl = settings ?? {}
  const enabled = !!wl.wl_enabled
  return {
    enabled,
    brandName: (enabled ? clean(wl.wl_brand_name) : null) ?? clean(workspaceName) ?? "Propvora",
    hidePoweredBy: enabled && !!wl.wl_hide_powered_by,
    supportEmail: enabled ? clean(wl.wl_custom_support_email) : null,
    portalName: enabled ? clean(wl.wl_portal_custom_name) : null,
    loginHeadline: enabled ? clean(wl.wl_custom_login_headline) : null,
  }
}
