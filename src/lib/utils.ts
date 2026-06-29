import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatCurrencyAmount } from "@/lib/i18n/format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (GBP by default). Delegates to the shared i18n
 * currency core (A11) preserving this helper's min-0 / max-2 fraction rule.
 */
export function formatCurrency(
  amount: number,
  currency = "GBP",
  locale = "en-GB"
): string {
  return formatCurrencyAmount(amount, currency, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** Format a date to a readable string */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  locale = "en-GB"
): string {
  return new Intl.DateTimeFormat(locale, options).format(
    typeof date === "string" ? new Date(date) : date
  )
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "…"
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** Sleep for n milliseconds */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Check if a value is defined (not null or undefined) */
export function isDefined<T>(val: T | null | undefined): val is T {
  return val !== null && val !== undefined
}

/** Generate a URL-safe slug from a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
