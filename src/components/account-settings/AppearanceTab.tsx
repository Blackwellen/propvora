"use client"

import React from "react"
import { Check, LayoutTemplate, PanelLeftOpen, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useShellStyle } from "@/contexts/ShellStyleContext"
import { SHELL_STYLE_META, type ShellStyle, type ShellLayout } from "@/lib/shell"
import { Toggle } from "./shared"

// ── Mini shell preview ────────────────────────────────────────────────────────
function ShellStyleMiniPreview({ style: _style }: { style: ShellStyle }) {
  return (
    <div
      className="w-full h-[88px] rounded-xl overflow-hidden relative"
      style={{ background: "var(--color-surface, #F8FAFC)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[30px] flex flex-col"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        <div className="w-3 h-1.5 rounded mx-auto mt-2 mb-2" style={{ background: "#2563EB" }} />
        {[true, false, false, false].map((active, i) => (
          <div
            key={i}
            className="mx-1.5 mb-1 h-2 rounded-sm"
            style={{
              background: active ? "#EFF6FF" : "transparent",
              border: active ? "none" : "1px solid var(--color-border)",
            }}
          />
        ))}
      </div>
      <div
        className="absolute left-[30px] right-0 top-0 h-[18px] flex items-center px-2 gap-1.5"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-border)" }} />
        <div className="w-5 h-3.5 rounded-md" style={{ background: "#2563EB" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-border)" }} />
      </div>
      <div className="absolute left-[30px] right-0 top-[18px] bottom-0 p-2 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {[70, 50, 40].map((w, i) => (
            <div key={i} className="h-3.5 rounded-md" style={{ width: `${w}%`, background: "rgba(0,0,0,0.05)" }} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {[40, 60].map((w, i) => (
            <div key={i} className="h-3.5 rounded-md" style={{ width: `${w}%`, background: "rgba(0,0,0,0.04)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Layout mode card ──────────────────────────────────────────────────────────
function LayoutModeCard({
  mode,
  selected,
  onClick,
}: {
  mode: ShellLayout
  selected: boolean
  onClick: () => void
}) {
  const isSideTop = mode === "side-and-top"

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left w-full",
        selected
          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-100 relative">
        {isSideTop ? (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#0D1B2A]" />
            <div className="absolute left-8 right-0 top-0 h-4 bg-white border-b border-slate-200" />
            <div className="absolute left-8 right-0 top-4 bottom-0 bg-[#F8FAFC]" />
          </>
        ) : (
          <>
            <div className="absolute left-0 right-0 top-0 h-5 bg-[#0D1B2A]" />
            <div className="absolute left-0 right-0 top-5 bottom-0 bg-[#F8FAFC]" />
          </>
        )}
      </div>
      <div className="flex items-start gap-2">
        {isSideTop
          ? <PanelLeftOpen className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
          : <LayoutTemplate className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
        }
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {isSideTop ? "Side nav + Top nav" : "Top nav only"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            {isSideTop
              ? "Sidebar with full nav depth + matching top bar."
              : "Full-width top bar with inline nav links and compact widgets."}
          </p>
        </div>
      </div>
    </button>
  )
}

// ── Main tab component ────────────────────────────────────────────────────────
export default function AppearanceTab() {
  const {
    prefs,
    setStyle,
    setLayout,
    setCollapsed,
    setTopNavCompact,
    savePrefs,
    resetPrefs,
    isSaving,
    isSaved,
  } = useShellStyle()

  const ALL_STYLES = Object.entries(SHELL_STYLE_META).sort(
    ([, a], [, b]) => a.number - b.number
  ) as [ShellStyle, (typeof SHELL_STYLE_META)[ShellStyle]][]

  return (
    <div className="space-y-8">
      {/* Shell Style */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Shell Style</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose the visual style for your navigation and shell.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ALL_STYLES.map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={cn(
                "relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left",
                prefs.shell_style === key
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {prefs.shell_style === key && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center",
                    prefs.shell_style === key ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {meta.number}
                </span>
                <span className="text-sm font-semibold text-slate-900 leading-tight">{meta.label}</span>
                {meta.isDefault && (
                  <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <ShellStyleMiniPreview style={key} />
              <p className="text-[11.5px] text-slate-500 leading-snug">{meta.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Shell Layout */}
      <div className="border-t border-slate-200 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Shell Layout</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose how navigation is structured across the interface.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <LayoutModeCard
            mode="side-and-top"
            selected={prefs.shell_layout === "side-and-top"}
            onClick={() => setLayout("side-and-top")}
          />
          <LayoutModeCard
            mode="top-only"
            selected={prefs.shell_layout === "top-only"}
            onClick={() => setLayout("top-only")}
          />
        </div>
      </div>

      {/* Additional options */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Additional Options</h3>
        {[
          {
            id: "collapse",
            label: "Collapse side nav by default",
            desc: "Start with the sidebar in icon-only mode.",
            value: prefs.side_nav_collapsed,
            onChange: setCollapsed,
            disabled: prefs.shell_layout === "top-only",
          },
          {
            id: "compact",
            label: "Compact top nav on scroll",
            desc: "Top bar shrinks to compact mode when you scroll down.",
            value: prefs.top_nav_compact,
            onChange: setTopNavCompact,
            disabled: false,
          },
        ].map(opt => (
          <div
            key={opt.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white transition-opacity",
              opt.disabled && "opacity-40 pointer-events-none"
            )}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </div>
            <Toggle checked={opt.value} onChange={opt.onChange} />
          </div>
        ))}
      </div>

      {/* Save / reset */}
      <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={savePrefs}
          loading={isSaving}
          leftIcon={isSaved ? <Check className="w-4 h-4" /> : undefined}
        >
          {isSaved ? "Saved!" : "Save Appearance"}
        </Button>
        <Button variant="outline" onClick={resetPrefs} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
          Reset to defaults
        </Button>
        <p className="text-xs text-slate-400 ml-auto">
          These settings are saved to your account — each team member can have their own shell.
        </p>
      </div>
    </div>
  )
}
