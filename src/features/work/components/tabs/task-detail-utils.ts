export const COMMENT_AVATAR_BG = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"]

/** Short relative time like "2h ago" / "3d ago", falling back to a date. */
export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ""
  const diff = Date.now() - t
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** Deterministic avatar colour from a seed string. */
export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return COMMENT_AVATAR_BG[Math.abs(h) % COMMENT_AVATAR_BG.length]
}
