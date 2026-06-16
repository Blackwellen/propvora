"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"
import { customerInputClass } from "./ui"

export default function WorkspaceSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initial)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const term = q.trim()
        router.push(term ? `/user/search?q=${encodeURIComponent(term)}` : "/user/search")
      }}
      className="relative"
    >
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
        placeholder="Search bookings, messages and documents…"
        aria-label="Search your workspace"
        className={`${customerInputClass} h-12 pl-11 text-[15px]`}
      />
    </form>
  )
}
