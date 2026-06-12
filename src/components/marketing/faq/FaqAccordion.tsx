"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FaqAccordionProps {
  question: string
  answer: string
  defaultOpen?: boolean
}

export function FaqAccordion({ question, answer, defaultOpen = false }: FaqAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        "border border-slate-200 rounded-xl bg-white transition-all duration-200",
        open && "border-l-4 border-l-blue-500 shadow-sm"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-xl"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 text-sm leading-snug">{question}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
            open && "rotate-180 text-blue-500"
          )}
        />
      </button>

      {/* Grid trick for smooth height transition without JS measuring */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

interface FaqGroupItem {
  q: string
  a: string
}

interface FaqGroupProps {
  id?: string
  title: string
  icon: React.ReactNode
  colour: string
  items: FaqGroupItem[]
}

export function FaqGroup({ id, title, icon, colour, items }: FaqGroupProps) {
  return (
    <section id={id} className="scroll-mt-24">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            colour
          )}
        >
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>

      {/* Accordion list */}
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <FaqAccordion key={i} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  )
}
