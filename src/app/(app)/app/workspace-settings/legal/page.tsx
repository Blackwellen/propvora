// Canonical location for Legal settings. `next.config.ts` redirects
// `/property-manager/settings/legal` here (via the settings/:path* catch-all), but
// no page existed at this target — leaving the Legal settings (custom legal module
// editor) unreachable (404). This re-exports the existing settings page so the
// canonical workspace-settings route resolves. `dynamic` is declared statically
// (Next forbids re-exporting route segment config).
export { default } from "../../settings/legal/page"

export const dynamic = "force-dynamic"
