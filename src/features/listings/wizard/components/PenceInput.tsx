"use client"

// A money input that stores integer pence but edits in major units.
import React from "react"

export function PenceInput({
  pence,
  onChange,
  currency = "GBP",
}: {
  pence: number
  onChange: (pence: number) => void
  currency?: string
}) {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : ""
  const major = (pence / 100).toFixed(2)
  return (
    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[var(--color-brand-400)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
      <span className="mr-1 text-[13px] font-semibold text-slate-400">{symbol}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        defaultValue={major}
        key={pence}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          onChange(Number.isFinite(v) ? Math.round(v * 100) : 0)
        }}
        className="w-full bg-transparent text-[13px] font-medium text-slate-900 outline-none tabular-nums"
      />
    </div>
  )
}
