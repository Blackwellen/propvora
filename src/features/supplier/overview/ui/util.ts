/* Small Overview-local formatting helpers. Money is handled by formatPence. */

export function clockTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** Relative "due in" string from now to an ISO target. */
export function dueIn(iso: string | null | undefined): { label: string; overdue: boolean } {
  if (!iso) return { label: "—", overdue: false }
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms)) return { label: "—", overdue: false }
  const overdue = ms < 0
  const abs = Math.abs(ms)
  const mins = Math.round(abs / 60000)
  let label: string
  if (mins < 60) label = `${mins}m`
  else if (mins < 1440) label = `${Math.round(mins / 60)}h`
  else label = `${Math.round(mins / 1440)}d`
  return { label: overdue ? `${label} overdue` : `in ${label}`, overdue }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ""
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
