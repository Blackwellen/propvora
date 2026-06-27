"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  Briefcase,
  BarChart3,
  Users,
  Wallet,
  Calendar,
  ShieldCheck,
  FileText,
  GripVertical,
  Check,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALL_QUICK_WIDGETS,
  loadQuickBarPrefs,
  loadQuickBarPrefsFromDb,
  saveQuickBarPrefsEverywhere,
  gateWidgets,
  type QuickBarPrefs,
} from "@/lib/quickbar"
import { useWorkspace } from "@/providers/AuthProvider"
import { saveWorkspaceNav } from "@/lib/actions/settings"
import { useQuickbarFlags } from "@/hooks/useQuickbarFlags"

// ─── Sidebar module visibility ────────────────────────────────────────────────

interface MenuModule {
  key: string
  label: string
  visible: boolean
  canHide: boolean
  icon: React.ElementType
  colour: string
}

const DEFAULT_MODULES: MenuModule[] = [
  { key: "portfolio",  label: "Portfolio",  visible: true, canHide: false, icon: Building2,  colour: "#2563EB" },
  { key: "work",       label: "Work",       visible: true, canHide: true,  icon: Briefcase,  colour: "#059669" },
  { key: "planning",   label: "Planning",   visible: true, canHide: true,  icon: BarChart3,  colour: "#7C3AED" },
  { key: "contacts",   label: "Contacts",   visible: true, canHide: true,  icon: Users,      colour: "#D97706" },
  { key: "money",      label: "Money",      visible: true, canHide: true,  icon: Wallet,     colour: "#059669" },
  { key: "calendar",   label: "Calendar",   visible: true, canHide: true,  icon: Calendar,   colour: "#2563EB" },
  { key: "compliance", label: "Compliance", visible: true, canHide: true,  icon: ShieldCheck, colour: "#D97706" },
  { key: "documents",  label: "Documents",  visible: true, canHide: true,  icon: FileText,   colour: "#64748B" },
]

const WIDGET_GROUPS = ["Portfolio", "Work", "Contacts", "Money", "Planning", "Other"] as const

// ─── Component ────────────────────────────────────────────────────────────────

const LANDING_OPTIONS = [
  { value: "/property-manager/portfolio", label: "Portfolio" },
  { value: "/property-manager/work",       label: "Work" },
  { value: "/property-manager/money",      label: "Money" },
  { value: "/property-manager/calendar",   label: "Calendar" },
  { value: "/property-manager/contacts",   label: "Contacts" },
  { value: "/property-manager/compliance", label: "Compliance" },
]

export default function NavigationPage() {
  const { workspace, refreshWorkspace } = useWorkspace()
  const [modules, setModules] = useState<MenuModule[]>(DEFAULT_MODULES)
  const [modulesDirty, setModulesDirty] = useState(false)
  const [modulesSaved, setModulesSaved] = useState(false)
  const [modulesSaving, setModulesSaving] = useState(false)
  const [modulesError, setModulesError] = useState<string | null>(null)

  const [landing, setLanding] = useState("/property-manager/portfolio")
  const [landingSaving, setLandingSaving] = useState(false)
  const [landingSaved, setLandingSaved] = useState(false)

  const [prefs, setPrefs] = useState<QuickBarPrefs | null>(null)
  const [prefsDirty, setPrefsDirty] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  useEffect(() => {
    setPrefs(loadQuickBarPrefs())
    // Hydrate from the DB (cross-device) — overrides localStorage when present.
    loadQuickBarPrefsFromDb().then(db => { if (db) setPrefs(db) })
  }, [])

  // Hydrate module visibility + landing page from the workspace nav config.
  useEffect(() => {
    const nav = workspace?.settings?.nav
    if (!nav) return
    const hidden = new Set(nav.hiddenModules ?? [])
    setModules(prev => prev.map(m => m.canHide ? { ...m, visible: !hidden.has(m.key) } : m))
    if (nav.defaultLanding) setLanding(nav.defaultLanding)
  }, [workspace?.settings?.nav])

  function handleModuleToggle(key: string) {
    setModules(prev => prev.map(m => m.key === key && m.canHide ? { ...m, visible: !m.visible } : m))
    setModulesDirty(true)
    setModulesSaved(false)
    setModulesError(null)
  }

  async function handleModulesSave() {
    setModulesSaving(true)
    setModulesError(null)
    const hiddenModules = modules.filter(m => m.canHide && !m.visible).map(m => m.key)
    const res = await saveWorkspaceNav({ hiddenModules })
    setModulesSaving(false)
    if (!res.ok) { setModulesError(res.error ?? "Failed to save."); return }
    await refreshWorkspace()
    setModulesDirty(false)
    setModulesSaved(true)
    setTimeout(() => setModulesSaved(false), 2500)
  }

  async function handleLandingChange(value: string) {
    setLanding(value)
    setLandingSaving(true)
    setLandingSaved(false)
    const res = await saveWorkspaceNav({ defaultLanding: value })
    setLandingSaving(false)
    if (res.ok) {
      await refreshWorkspace()
      setLandingSaved(true)
      setTimeout(() => setLandingSaved(false), 2500)
    }
  }

  function toggleWidget(key: string) {
    if (!prefs) return
    const next = { ...prefs, visible: { ...prefs.visible, [key]: !prefs.visible[key] } }
    setPrefs(next)
    setPrefsDirty(true)
    setPrefsSaved(false)
  }

  function handleWidgetDrop(toKey: string) {
    if (!prefs || !dragKey || dragKey === toKey) return
    const next = [...prefs.order]
    const fi = next.indexOf(dragKey)
    const ti = next.indexOf(toKey)
    if (fi < 0 || ti < 0) return
    next.splice(fi, 1)
    next.splice(ti, 0, dragKey)
    setPrefs({ ...prefs, order: next })
    setDragKey(null)
    setDragOver(null)
    setPrefsDirty(true)
    setPrefsSaved(false)
  }

  function handlePrefsSave() {
    if (!prefs) return
    void saveQuickBarPrefsEverywhere(prefs)
    setPrefsDirty(false)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2500)
  }

  // Flag-gated widget catalogue: a workspace can only pin shortcuts to surfaces
  // its feature flags have enabled (e.g. no Planning widgets until Planning is on).
  const gatedFlags = useQuickbarFlags()
  const allowedWidgets = new Set(gateWidgets(ALL_QUICK_WIDGETS, gatedFlags).map(w => w.key))

  const visibleCount = prefs
    ? Object.entries(prefs.visible).filter(([k, v]) => v && allowedWidgets.has(k)).length
    : 0

  return (
    <div className="relative pb-24">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Menu Builder</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Control sidebar modules and the quick-access bar at the top of every page.
        </p>
      </div>

      {/* ── Section 1: Sidebar modules ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Sidebar Module Visibility</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Show or hide modules in the left navigation for your team.</p>
          </div>
          {modulesSaved && (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
              <Check className="w-4 h-4" />Saved
            </span>
          )}
        </div>
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <div key={mod.key} className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: mod.colour + "15" }}>
                  <div style={{ color: mod.colour }}><Icon className="w-4 h-4" /></div>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-800">{mod.label}</p>
                  {!mod.canHide && <p className="text-[11px] text-slate-400">Required — cannot be hidden</p>}
                </div>
              </div>
              <button
                onClick={() => handleModuleToggle(mod.key)}
                disabled={!mod.canHide}
                className={cn("w-10 h-6 rounded-full transition-colors relative", mod.visible ? "bg-[var(--brand)]" : "bg-slate-200", !mod.canHide && "opacity-40 cursor-not-allowed")}
              >
                <span className={cn("absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform", mod.visible ? "translate-x-5" : "translate-x-1")} />
              </button>
            </div>
          )
        })}
        {modulesDirty && (
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            {modulesError && <p className="text-[12px] text-red-500 mr-auto">{modulesError}</p>}
            <button onClick={() => { setModules(DEFAULT_MODULES); setModulesDirty(false); setModulesError(null) }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors">
              Reset
            </button>
            <button onClick={handleModulesSave} disabled={modulesSaving}
              className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60">
              {modulesSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      {/* ── Section 2: Quick Bar ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Quick Bar</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Customise the widget bar at the top of every page. Toggle and reorder shortcuts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {prefsSaved && (
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
                <Check className="w-4 h-4" />Saved
              </span>
            )}
            <span className="text-[12px] text-slate-400">{visibleCount} showing</span>
            {prefsDirty && (
              <button onClick={handlePrefsSave}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
                <Check className="w-3.5 h-3.5" />Save Quick Bar
              </button>
            )}
          </div>
        </div>

        {prefs && WIDGET_GROUPS.map(group => {
          const groupWidgets = prefs.order
            .map(k => ALL_QUICK_WIDGETS.find(w => w.key === k))
            .filter((w): w is NonNullable<typeof w> => !!w && w.group === group && allowedWidgets.has(w.key))

          if (!groupWidgets.length) return null

          return (
            <div key={group} className="mt-5">
              <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groupWidgets.map(widget => {
                  const Icon = widget.icon
                  const on = prefs.visible[widget.key]
                  const isDraggingOver = dragOver === widget.key

                  return (
                    <div
                      key={widget.key}
                      draggable
                      onDragStart={() => setDragKey(widget.key)}
                      onDragOver={e => { e.preventDefault(); setDragOver(widget.key) }}
                      onDrop={() => handleWidgetDrop(widget.key)}
                      onDragEnd={() => { setDragKey(null); setDragOver(null) }}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all select-none",
                        isDraggingOver ? "border-[#7C3AED] scale-[1.02] shadow-md" : on ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-50"
                      )}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: on ? widget.bg : "var(--color-surface-sunken, #F1F5F9)" }}>
                        <div style={{ color: on ? widget.colour : "var(--text-disabled)" }}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Label + href */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-semibold truncate", on ? "text-slate-800" : "text-slate-400")}>{widget.label}</p>
                        <p className="text-[10.5px] text-slate-400 truncate">{widget.href}</p>
                      </div>

                      {/* Preview chip */}
                      {on && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0"
                          style={{ background: widget.bg, color: widget.colour }}>
                          <div style={{ color: widget.colour }}><Icon className="w-3 h-3" /></div>
                          {widget.label}
                        </div>
                      )}

                      {/* Toggle */}
                      <button
                        onClick={() => toggleWidget(widget.key)}
                        className={cn("w-10 h-6 rounded-full transition-colors relative shrink-0", on ? "bg-[#7C3AED]" : "bg-slate-200")}
                      >
                        <span className={cn("absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform", on ? "translate-x-5" : "translate-x-1")} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Preview strip */}
        {prefs && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11.5px] font-semibold text-slate-500 mb-3">Preview</p>
            <div className="flex items-center gap-1.5 flex-wrap p-3 bg-[#F6FAFF] rounded-2xl border border-slate-200">
              {prefs.order
                .map(k => ALL_QUICK_WIDGETS.find(w => w.key === k))
                .filter((w): w is NonNullable<typeof w> => !!w && prefs.visible[w.key] && allowedWidgets.has(w.key))
                .map(w => {
                  const Icon = w.icon
                  return (
                    <div key={w.key}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
                      style={{ background: w.bg, color: w.colour }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: w.colour }}>
                        <div style={{ color: "#fff" }}><Icon className="w-3 h-3" /></div>
                      </div>
                      {w.label}
                    </div>
                  )
                })}
              {visibleCount === 0 && <p className="text-[12px] text-slate-400">No widgets selected — bar will be hidden.</p>}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Default landing page ───────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-bold text-slate-900">Default Landing Page</h3>
          {landingSaved && (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
              <Check className="w-4 h-4" />Saved
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-slate-500 mb-3">Choose which page users land on after logging in.</p>
        <select
          value={landing}
          onChange={e => handleLandingChange(e.target.value)}
          disabled={landingSaving}
          className="w-full max-w-[320px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] transition-all disabled:opacity-60"
        >
          {LANDING_OPTIONS.filter(o => {
            // Only offer visible modules as landing targets.
            const key = o.value.split("/").pop()
            const mod = modules.find(m => m.key === key)
            return !mod || mod.visible
          }).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {landingSaving && <p className="text-[11px] text-slate-400 mt-1.5">Saving…</p>}
      </div>
    </div>
  )
}
