"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsCard                                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "danger" | "locked" | "success"
  badge?: string
}

export function SettingsCard({
  title,
  description,
  children,
  action,
  variant = "default",
  badge,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border p-5 sm:p-6",
        variant === "danger"
          ? "border-red-200 bg-red-50/30"
          : variant === "locked"
          ? "border-slate-200 bg-slate-50/50 opacity-75"
          : variant === "success"
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsFieldRow                                                     */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface SettingsFieldRowProps {
  label: string
  description?: string
  children: React.ReactNode
  required?: boolean
}

export function SettingsFieldRow({
  label,
  description,
  children,
  required,
}: SettingsFieldRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-4 border-b border-slate-100 last:border-0">
      <div className="w-full sm:w-[220px] shrink-0">
        <label className="text-[13px] font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {description && (
          <p className="text-[11.5px] text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-1 w-full min-w-0">{children}</div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsToggle                                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface SettingsToggleProps {
  label: string
  description?: string
  enabled: boolean
  onChange: (v: boolean) => void
  locked?: boolean
  badge?: string
}

export function SettingsToggle({
  label,
  description,
  enabled,
  onChange,
  locked,
  badge,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {badge}
            </span>
          )}
          {locked && <Lock className="w-3 h-3 text-slate-300" />}
        </div>
        {description && (
          <p className="text-[11.5px] text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => !locked && onChange(!enabled)}
        disabled={locked}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
          enabled && !locked ? "bg-[#2563EB]" : "bg-slate-200",
          locked && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsSaveBar                                                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface SettingsSaveBarProps {
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
  saving?: boolean
}

export function SettingsSaveBar({
  isDirty,
  onSave,
  onDiscard,
  saving,
}: SettingsSaveBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="pwa-safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3"
        >
          <p className="text-[13px] text-slate-600 font-medium truncate">
            <span className="hidden sm:inline">You have unsaved changes</span>
            <span className="sm:hidden">Unsaved changes</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDiscard}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsLockedCard                                                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface SettingsLockedCardProps {
  title: string
  description: string
  planRequired: string
  icon?: React.ElementType
}

export function SettingsLockedCard({
  title,
  description,
  planRequired,
  icon: Icon,
}: SettingsLockedCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-violet-200 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
        {Icon ? (
          <Icon className="w-6 h-6 text-violet-600" />
        ) : (
          <Lock className="w-6 h-6 text-violet-400" />
        )}
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-[13px] text-slate-500 mb-4">{description}</p>
      <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
        {planRequired}
      </span>
    </div>
  )
}
