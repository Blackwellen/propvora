"use client"

interface BusinessLogoAvatarProps {
  name: string
  size?: number
  bgColor?: string
}

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const COLORS = [
    "#0F766E", // teal
    "#1E40AF", // dark blue
    "#065F46", // dark green
    "#7C2D12", // dark orange-red
    "#4C1D95", // dark purple
    "#1F2937", // dark slate
    "#0C4A6E", // dark sky
    "#134E4A", // dark teal
    "#1E3A5F", // navy
    "#3B1F8C", // deep violet
  ]
  return COLORS[Math.abs(hash) % COLORS.length] ?? "#1E40AF"
}

function getAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0]?.slice(0, 2) ?? "??").toUpperCase()
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase()
}

export default function BusinessLogoAvatar({
  name,
  size = 40,
  bgColor,
}: BusinessLogoAvatarProps) {
  const bg = bgColor ?? hashColor(name)
  const abbr = getAbbreviation(name)
  const fontSize = Math.round(size * 0.34)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 700,
        color: "#FFFFFF",
        letterSpacing: "0.04em",
        userSelect: "none",
        flexShrink: 0,
      }}
      aria-label={name}
    >
      {abbr}
    </div>
  )
}
