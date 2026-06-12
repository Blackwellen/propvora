"use client"

interface PersonAvatarProps {
  name: string
  size?: number
  online?: boolean
}

const GRADIENT_MAP: Record<string, [string, string]> = {
  A: ["#3B82F6", "#1D4ED8"],
  B: ["#3B82F6", "#1D4ED8"],
  C: ["#7C3AED", "#5B21B6"],
  D: ["#7C3AED", "#5B21B6"],
  E: ["#059669", "#047857"],
  F: ["#059669", "#047857"],
  G: ["#D97706", "#B45309"],
  H: ["#D97706", "#B45309"],
  I: ["#2563EB", "#1E40AF"],
  J: ["#2563EB", "#1E40AF"],
  K: ["#E11D48", "#BE185D"],
  L: ["#E11D48", "#BE185D"],
  M: ["#4F46E5", "#3730A3"],
  N: ["#4F46E5", "#3730A3"],
  O: ["#0D9488", "#0F766E"],
  P: ["#0D9488", "#0F766E"],
  Q: ["#EA580C", "#C2410C"],
  R: ["#EA580C", "#C2410C"],
  S: ["#475569", "#2563EB"],
  T: ["#475569", "#2563EB"],
  U: ["#9333EA", "#7E22CE"],
  V: ["#9333EA", "#7E22CE"],
  W: ["#16A34A", "#15803D"],
  X: ["#16A34A", "#15803D"],
  Y: ["#16A34A", "#15803D"],
  Z: ["#16A34A", "#15803D"],
}

function getGradient(name: string): [string, string] {
  const first = (name.charAt(0) ?? "A").toUpperCase()
  return GRADIENT_MAP[first] ?? ["#3B82F6", "#1D4ED8"]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "??").toUpperCase()
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

export default function PersonAvatar({ name, size = 40, online }: PersonAvatarProps) {
  const [from, to] = getGradient(name)
  const initials = getInitials(name)
  const fontSize = Math.round(size * 0.36)

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "0.03em",
          userSelect: "none",
          flexShrink: 0,
        }}
        aria-label={name}
      >
        {initials}
      </div>
      {online && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: Math.round(size * 0.28),
            height: Math.round(size * 0.28),
            borderRadius: "50%",
            background: "#22C55E",
            border: "2px solid #FFFFFF",
          }}
        />
      )}
    </div>
  )
}
