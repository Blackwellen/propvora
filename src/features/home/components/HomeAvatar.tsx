"use client"

import { Shield } from "lucide-react"

interface HomeAvatarProps {
  initials?: string
  color?: string
  size?: number
  isIcon?: boolean
  iconType?: string
}

export function HomeAvatar({ initials, color = "#2563EB", size = 36, isIcon = false, iconType }: HomeAvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    backgroundColor: isIcon ? undefined : color,
    fontSize: size * 0.35,
  }

  if (isIcon && iconType === "shield") {
    return (
      <div
        className="rounded-full flex items-center justify-center bg-emerald-100"
        style={style}
      >
        <Shield className="text-emerald-600" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={style}
    >
      {initials}
    </div>
  )
}
