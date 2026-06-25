// Canonical location for Compliance settings. `next.config.ts` redirects the
// stale `/property-manager/settings/compliance` here, but no page existed at this
// target — leaving the Compliance settings (incl. the jurisdiction requirements
// editor) unreachable. This re-exports the existing settings page so the
// canonical workspace-settings route resolves. `dynamic` must be declared
// statically (Next forbids re-exporting route segment config).
export { default } from "../../settings/compliance/page"

export const dynamic = "force-dynamic"
