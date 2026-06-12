"use client"

interface ContactAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const SIZE_PX: Record<NonNullable<ContactAvatarProps["size"]>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

const SIZE_CLASS: Record<NonNullable<ContactAvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
}

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-indigo-500",
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorClass(name: string): string {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return COLORS[sum % 8]
}

export default function ContactAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: ContactAvatarProps) {
  const sizeClass = SIZE_CLASS[size]
  const px = SIZE_PX[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={px}
        height={px}
        className={["rounded-full object-cover shrink-0", sizeClass, className].join(" ")}
      />
    )
  }

  const colorClass = getColorClass(name)
  const initials = getInitials(name)

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full shrink-0 font-semibold text-white",
        colorClass,
        sizeClass,
        className,
      ].join(" ")}
      aria-label={name}
    >
      {initials}
    </span>
  )
}
