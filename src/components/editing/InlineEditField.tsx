"use client"

import React, { useEffect, useId, useRef } from "react"
import { Check, X, Pencil, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInlineEdit } from "@/hooks/useInlineEdit"
import { useIsMobile } from "@/components/mobile/useBreakpoint"
import MobileSheet from "@/components/mobile/MobileSheet"

/* ──────────────────────────────────────────────────────────────────────────
   GLOBAL INLINE-EDITING SYSTEM — base field.

   Unifies the old portfolio + work InlineEditField components into one
   always-visible, accessible, mobile/PWA-friendly editor.

   Key guarantees vs the old hover-only fields:
   - The edit pen is ALWAYS visible (never `opacity-0 group-hover`).
   - Value-click OR pen-click enters edit; Enter saves, Esc cancels.
   - Visible Save + Cancel buttons; saving / disabled / permission states.
   - Field-level validation error rendered inline.
   - focus-visible ring everywhere; `aria-label="Edit {label}"`.
   - No layout shift between display and edit (reserved control slot).
   - On mobile, cramped contexts open a MobileSheet editor; otherwise a
     compact inline editor with ≥44px touch targets.
   - readOnly / disabled path shows a clear (optionally tooltip'd) reason.

   Presentation + state only — the caller's `onSave` owns the Supabase
   mutation (workspace-scoped + RLS) and query invalidation.
─────────────────────────────────────────────────────────────────────────── */

export type InlineEditType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "url"
  | "email"
  | "phone"

export interface InlineEditOption {
  value: string
  label: string
}

export interface InlineEditFieldProps {
  value: string | number | null | undefined
  onSave: (val: string) => Promise<void>
  type?: InlineEditType
  options?: InlineEditOption[]
  placeholder?: string
  className?: string
  displayClassName?: string
  /** Rendered before the value (e.g. "£"). Applied to both display + editor. */
  prefix?: string
  /** Legacy alias preserved from the old components — same as `readOnly`. */
  disabled?: boolean
  /** Read-only path. Shows the value with no pen and no editing. */
  readOnly?: boolean
  /** Explanation for why the field is locked (tooltip + sr text). */
  readOnlyReason?: string
  /** Accessible label fragment: aria becomes `Edit {label}`. */
  label?: string
  /** Optional sync validation; return an error string to block the save. */
  validate?: (val: string) => string | null | undefined
  /** When false, the field is locked like readOnly (permission-denied). */
  permission?: boolean
  /** Force the mobile bottom-sheet editor (cramped contexts). */
  useSheetOnMobile?: boolean
  /** Suppress the success/error toast (dense tables). */
  silentToast?: boolean
  /** Dense table-cell sizing. */
  dense?: boolean
}

/** Shared input styling — Propvora navy/blue, focus ring, no dark classes. */
const inputBase =
  "text-[13px] border border-[#2563EB] rounded-lg px-2.5 py-1.5 bg-white text-slate-900 w-full " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 focus:ring-2 focus:ring-[#2563EB]/20"

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
  readOnly,
  readOnlyReason,
  label,
  validate,
  permission,
  useSheetOnMobile,
  silentToast,
  dense,
}: InlineEditFieldProps) {
  const locked = readOnly || disabled || permission === false
  const isMobile = useIsMobile()
  const fieldId = useId()

  const {
    editing,
    saving,
    error,
    draft,
    displayValue,
    setDraft,
    enterEdit,
    cancel,
    save,
  } = useInlineEdit<string>({
    value: String(value ?? ""),
    onSave,
    validate,
    permission: !locked,
    label,
    silent: silentToast,
  })

  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >(null)

  // Autofocus the editor when it opens (desktop / compact mobile).
  useEffect(() => {
    if (editing && !(isMobile && useSheetOnMobile)) {
      inputRef.current?.focus()
    }
  }, [editing, isMobile, useSheetOnMobile])

  const ariaLabel = label ? `Edit ${label}` : "Edit field"

  // ── Display string (option label resolution + prefix) ─────────────────────
  const resolvedLabel =
    options?.find((o) => o.value === String(displayValue ?? ""))?.label
  const hasValue = displayValue != null && displayValue !== ""
  const shown =
    resolvedLabel ??
    (hasValue ? (prefix ? `${prefix}${displayValue}` : String(displayValue)) : null)

  function DisplayText() {
    return (
      <span className={cn("text-[13px] text-slate-700", displayClassName)}>
        {shown ?? (
          <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
        )}
      </span>
    )
  }

  // ── Read-only / disabled / permission-denied path ─────────────────────────
  if (locked) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        title={readOnlyReason}
      >
        <DisplayText />
        {readOnlyReason && (
          <>
            <Lock className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />
            <span className="sr-only">
              {label ? `${label} is read-only. ` : "Read-only. "}
              {readOnlyReason}
            </span>
          </>
        )}
      </span>
    )
  }

  // ── Display (not editing) — value + ALWAYS-VISIBLE pen ─────────────────────
  if (!editing) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <button
          type="button"
          onClick={enterEdit}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-1 text-left rounded-md cursor-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
            "hover:bg-slate-50 transition-colors px-0.5 -mx-0.5"
          )}
        >
          <DisplayText />
        </button>
        <button
          type="button"
          onClick={enterEdit}
          aria-label={ariaLabel}
          className={cn(
            "shrink-0 inline-flex items-center justify-center rounded-md text-slate-400",
            "hover:text-[#2563EB] hover:bg-[#2563EB]/8 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
            // ≥44px touch target on mobile; compact on desktop.
            isMobile ? "w-9 h-9" : "w-6 h-6"
          )}
        >
          <Pencil className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
        </button>
      </span>
    )
  }

  // ── Editor field (shared by inline + sheet) ───────────────────────────────
  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault()
      void save()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      cancel()
    }
  }

  const htmlType =
    type === "currency" || type === "number"
      ? "number"
      : type === "email"
        ? "email"
        : type === "url"
          ? "url"
          : type === "phone"
            ? "tel"
            : type === "date"
              ? "date"
              : "text"

  const editorField = (full?: boolean) => {
    if (type === "textarea") {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={full ? 5 : 3}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          className={cn(inputBase, "resize-none", full || dense ? "" : "min-w-[200px]")}
        />
      )
    }
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel()
          }}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          className={cn(inputBase, full || dense ? "" : "min-w-[140px]")}
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        id={fieldId}
        type={htmlType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-invalid={!!error}
        className={cn(inputBase, full || dense ? "" : "min-w-[160px]")}
      />
    )
  }

  const SaveButton = ({ wide }: { wide?: boolean }) => (
    <button
      type="button"
      onClick={() => void save()}
      disabled={saving}
      aria-label="Save"
      className={cn(
        "rounded-lg bg-[#2563EB] text-white flex items-center justify-center gap-1.5",
        "hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
        wide ? "h-11 px-4 text-[13px] font-semibold flex-1" : isMobile ? "w-11 h-11" : "w-7 h-7"
      )}
    >
      {saving ? (
        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
      ) : (
        <Check className="w-4 h-4" />
      )}
      {wide && <span>Save</span>}
    </button>
  )

  const CancelButton = ({ wide }: { wide?: boolean }) => (
    <button
      type="button"
      onClick={cancel}
      disabled={saving}
      aria-label="Cancel"
      className={cn(
        "rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center gap-1.5",
        "hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        wide ? "h-11 px-4 text-[13px] font-semibold flex-1" : isMobile ? "w-11 h-11" : "w-7 h-7"
      )}
    >
      <X className="w-4 h-4" />
      {wide && <span>Cancel</span>}
    </button>
  )

  // ── Mobile sheet editor (cramped contexts) ────────────────────────────────
  if (isMobile && useSheetOnMobile) {
    return (
      <>
        {/* Trigger keeps showing the value + pen so there's no layout shift. */}
        <span className={cn("inline-flex items-center gap-1", className)}>
          <DisplayText />
          <button
            type="button"
            onClick={enterEdit}
            aria-label={ariaLabel}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </span>
        <MobileSheet
          open={editing}
          onClose={cancel}
          title={label ? `Edit ${label}` : "Edit"}
          footer={
            <div className="flex items-center gap-2">
              <CancelButton wide />
              <SaveButton wide />
            </div>
          }
        >
          <div className="px-2 py-3 flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-[12px] font-medium text-slate-500">
              {label ?? "Value"}
            </label>
            <div className="flex items-center gap-1.5">
              {prefix && <span className="text-[13px] text-slate-500">{prefix}</span>}
              {editorField(true)}
            </div>
            {error && (
              <p className="text-[12px] text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        </MobileSheet>
      </>
    )
  }

  // ── Inline editor (desktop + compact mobile) ──────────────────────────────
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex gap-1.5", type === "textarea" ? "items-start" : "items-center")}>
        {prefix && (
          <span
            className={cn(
              "text-[13px] text-slate-500",
              type === "textarea" && "pt-1.5"
            )}
          >
            {prefix}
          </span>
        )}
        {editorField()}
        <SaveButton />
        <CancelButton />
      </div>
      {error && (
        <p className="text-[11px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default InlineEditField
