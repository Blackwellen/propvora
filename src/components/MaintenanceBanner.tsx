import { createClient } from "@/lib/supabase/server"

// Site-wide maintenance notice for the "degraded" and "restricted" tiers.
// The "full" tier is handled by a redirect in proxy.ts (this never renders for
// the locked-out audience). Reads the same platform_settings row the admin
// console writes, so toggling a tier shows/updates the banner with no deploy.
export default async function MaintenanceBanner() {
  let cfg: { enabled?: boolean; mode?: string; message?: string } = {}
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle()
    cfg = (data?.value ?? {}) as typeof cfg
  } catch {
    return null // fail silent — never block the page on a banner
  }

  if (!cfg.enabled || (cfg.mode !== "degraded" && cfg.mode !== "restricted")) return null

  const restricted = cfg.mode === "restricted"
  const tone = restricted
    ? "bg-amber-500 text-amber-950"
    : "bg-sky-500 text-sky-950"
  const label = restricted ? "Read-only maintenance" : "Service notice"
  const fallback = restricted
    ? "Propvora is temporarily in read-only mode — you can view everything, but changes are paused while we carry out maintenance."
    : "We're carrying out scheduled maintenance. Everything remains available; you may notice brief interruptions."

  return (
    <div className={`${tone} w-full px-4 py-2 text-center text-[13px] font-medium`} role="status" aria-live="polite">
      <span className="font-bold">{label}:</span> {cfg.message?.trim() || fallback}
    </div>
  )
}
