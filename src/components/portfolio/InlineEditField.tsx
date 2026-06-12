"use client"
import React, { useState, useRef, useEffect } from "react"
import { Check, X, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  value: string | number | null | undefined
  onSave: (val: string) => Promise<void>
  type?: "text" | "textarea" | "select" | "date" | "number"
  options?: { value: string; label: string }[]
  placeholder?: string
  className?: string
  displayClassName?: string
  prefix?: string
  disabled?: boolean
}

export function InlineEditField({
  value,
  onSave,
  type = "text",
  options,
  placeholder,
  className,
  displayClassName,
  prefix,
  disabled,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ""))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    setDraft(String(value ?? ""))
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (draft === String(value ?? "")) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch (e: any) {
      setError(e.message ?? "Save failed")
      setDraft(String(value ?? ""))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(String(value ?? ""))
    setEditing(false)
    setError(null)
  }

  const displayVal =
    options?.find((o) => o.value === String(value ?? ""))?.label ??
    (value != null && value !== ""
      ? prefix
        ? `${prefix}${value}`
        : String(value)
      : null)

  if (disabled) {
    return (
      <span className={cn("text-[13px] text-slate-700", displayClassName)}>
        {displayVal ?? (
          <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
        )}
      </span>
    )
  }

  if (!editing) {
    return (
      <span
        className={cn(
          "group inline-flex items-center gap-1.5 cursor-pointer",
          className
        )}
        onClick={() => setEditing(true)}
      >
        <span className={cn("text-[13px] text-slate-700", displayClassName)}>
          {displayVal ?? (
            <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
          )}
        </span>
        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </span>
    )
  }

  const inputCls =
    "text-[13px] border border-[#2563EB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white text-slate-900 w-full"

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start gap-1.5">
        {prefix && (
          <span className="text-[13px] text-slate-500 pt-1.5">{prefix}</span>
        )}
        {type === "textarea" ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-none min-w-[200px]")}
          />
        ) : type === "select" ? (
          <select
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={cn(inputCls, "min-w-[140px]")}
          >
            {options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={type === "number" ? "number" : type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
            className={cn(inputCls, "min-w-[160px]")}
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 shrink-0 mt-0.5"
        >
          {saving ? (
            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={handleCancel}
          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0 mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
