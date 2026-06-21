"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

export default function ViewingCountdown() {
  const [countdown, setCountdown] = useState("22h 14m 32s")

  useEffect(() => {
    let secs = 22 * 3600 + 14 * 60 + 32
    const t = setInterval(() => {
      secs = Math.max(0, secs - 1)
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const s = secs % 60
      setCountdown(`${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-[#0D1B2A] text-white rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-[11.5px] text-white/60">Your viewing starts in</p>
        <p className="text-[22px] font-bold tabular-nums">{countdown}</p>
      </div>
      <Clock className="w-8 h-8 text-white/40" />
    </div>
  )
}
