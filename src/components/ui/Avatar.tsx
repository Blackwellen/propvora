"use client"

import React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"

const avatarSizes = {
  xs:  "w-6  h-6  text-[10px]",
  sm:  "w-8  h-8  text-xs",
  md:  "w-9  h-9  text-sm",
  lg:  "w-10 h-10 text-sm",
  xl:  "w-12 h-12 text-base",
  "2xl": "w-16 h-16 text-xl",
}

const avatarColours = [
  "bg-[var(--brand)] text-white",
  "bg-[#7C3AED] text-white",
  "bg-[#10B981] text-white",
  "bg-[#F59E0B] text-white",
  "bg-[#EF4444] text-white",
  "bg-[#0EA5E9] text-white",
  "bg-[#1E3A5F] text-white",
]

function getAvatarColour(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColours[Math.abs(hash) % avatarColours.length]
}

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: keyof typeof avatarSizes
  className?: string
  alt?: string
}

export function Avatar({ src, name = "?", size = "md", className, alt }: AvatarProps) {
  const initials = getInitials(name)
  const colour = getAvatarColour(name)

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        avatarSizes[size],
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt ?? name}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center font-semibold",
          colour
        )}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
