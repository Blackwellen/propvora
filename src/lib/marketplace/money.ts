export function formatPence(
  pence: number | null | undefined,
  currency: string | null | undefined = "GBP"
): string {
  if (pence === null || pence === undefined || !Number.isFinite(Number(pence))) return "—"
  const code = (currency ?? "GBP").toUpperCase()
  const major = Number(pence) / 100
  const hasFraction = Math.round(Number(pence)) % 100 !== 0

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    return `${code} ${major.toLocaleString("en-GB", { minimumFractionDigits: hasFraction ? 2 : 0 })}`
  }
}
