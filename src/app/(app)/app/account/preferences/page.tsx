"use client"

import { useState, useEffect } from "react"
import { Sun, Moon, Monitor, Info, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserPreferences, saveUserPreferences } from "@/lib/actions/settings"
import { useGuidedHelp } from "@/guided-help/GuidedHelpProvider"
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher"
import { isSupportedLocale, type Locale } from "@/lib/i18n/config"
import { useRouter } from "next/navigation"

type Theme   = "light" | "dark" | "system"
type Density = "compact" | "comfortable" | "spacious"
type CalView = "month" | "week" | "day" | "agenda"

type PrefsForm = {
  theme: Theme
  density: Density
  calView: CalView
  landingPage: string
  reducedMotion: boolean
}

export default function PreferencesPage() {
  const router = useRouter()
  const [form, setForm] = useState<PrefsForm>({
    theme: "light",
    density: "comfortable",
    calView: "month",
    landingPage: "/property-manager/portfolio",
    reducedMotion: false,
  })
  const [language, setLanguage] = useState<Locale>("en-GB")
  const [langSaving, setLangSaving] = useState(false)
  const [langError, setLangError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Guided product tour / tips toggle — persisted by the guided-help provider
  // (localStorage "propvora.help.enabled" + best-effort guided_help_state).
  const { enabled: tourEnabled, setEnabled: setTourEnabled } = useGuidedHelp()

  useEffect(() => {
    getUserPreferences().then(({ prefs, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (prefs) {
        setForm(f => ({
          theme:         (prefs.theme as PrefsForm["theme"]) ?? f.theme,
          density:       (prefs.density as PrefsForm["density"]) ?? f.density,
          calView:       (prefs.calendar_view as PrefsForm["calView"]) ?? f.calView,
          landingPage:   (prefs.landing_page as string) ?? f.landingPage,
          reducedMotion: typeof prefs.reduced_motion === "boolean" ? (prefs.reduced_motion as boolean) : f.reducedMotion,
        }))
        const stored = prefs.default_language as string | undefined
        if (stored && isSupportedLocale(stored)) setLanguage(stored)
      }
    })
  }, [])

  async function handleLanguageChange(locale: Locale) {
    setLanguage(locale)
    setLangSaving(true)
    setLangError(null)
    const res = await saveUserPreferences({ default_language: locale })
    setLangSaving(false)
    if (!res.ok && !res.unavailable) {
      setLangError(res.error ?? "Failed to save language.")
      return
    }
    router.refresh()
  }

  function update<K extends keyof PrefsForm>(key: K, value: PrefsForm[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setIsDirty(true)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveUserPreferences({
      theme: form.theme,
      density: form.density,
      calendar_view: form.calView,
      landing_page: form.landingPage,
      reduced_motion: form.reducedMotion,
    })
    setSaving(false)
    if (res.unavailable) { setUnavailable(true); setSaveError("Preferences storage is not configured yet."); return }
    if (!res.ok) { setSaveError(res.error ?? "Failed to save preferences."); return }
    setIsDirty(false)
  }

  const THEME_OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light",  label: "Light",  Icon: Sun },
    { value: "dark",   label: "Dark",   Icon: Moon },
    { value: "system", label: "System", Icon: Monitor },
  ]

  const DENSITY_OPTIONS: { value: Density; label: string; desc: string }[] = [
    { value: "compact",     label: "Compact",     desc: "More data, smaller spacing" },
    { value: "comfortable", label: "Comfortable", desc: "Balanced spacing (default)" },
    { value: "spacious",    label: "Spacious",    desc: "Larger touch targets" },
  ]

  const CAL_VIEW_OPTIONS: { value: CalView; label: string }[] = [
    { value: "month",  label: "Month" },
    { value: "week",   label: "Week" },
    { value: "day",    label: "Day" },
    { value: "agenda", label: "Agenda" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Preferences</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Customise your Propvora experience
        </p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Preferences storage is not provisioned yet — selections show defaults and can&apos;t be saved until the <code className="font-mono">user_preferences</code> table exists.
        </div>
      )}

      {/* Language & Region */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-slate-500" />
          <h3 className="text-[14px] font-bold text-slate-900">Language &amp; Region</h3>
        </div>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Sets your personal display language. Overrides the workspace default — takes effect on next page load.
        </p>
        <div className="max-w-xs">
          <LocaleSwitcher
            value={language}
            onChange={handleLanguageChange}
            refreshOnChange={false}
            hideLabel
          />
          {langSaving && (
            <p className="mt-1.5 text-[11.5px] text-slate-400 flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin inline-block" />
              Saving…
            </p>
          )}
          {langError && (
            <p className="mt-1.5 text-[11.5px] text-red-500">{langError}</p>
          )}
          {!langSaving && !langError && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Changes save instantly and refresh the page.
            </p>
          )}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Theme</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Choose your preferred colour scheme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(t => (
            <button
              key={t.value}
              onClick={() => update("theme", t.value)}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all",
                form.theme === t.value
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-slate-100 flex items-center justify-center">
                {t.value === "light"  && <Sun     className="w-4 h-4 text-amber-500" />}
                {t.value === "dark"   && <Moon    className="w-4 h-4 text-slate-700" />}
                {t.value === "system" && <Monitor className="w-4 h-4 text-slate-500" />}
              </div>
              <p className="text-[12px] font-semibold text-slate-700 capitalize">{t.label}</p>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Note: Dark mode is not yet available — light theme is always applied in this release.
        </p>
      </div>

      {/* Density */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Display Density</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Control how compact the interface appears</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {DENSITY_OPTIONS.map(d => (
            <button
              key={d.value}
              onClick={() => update("density", d.value)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                form.density === d.value
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className="text-[13px] font-semibold text-slate-800">{d.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar default view */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Calendar Default View</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Which view opens by default when you visit Calendar</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CAL_VIEW_OPTIONS.map(v => (
            <button
              key={v.value}
              onClick={() => update("calView", v.value)}
              className={cn(
                "p-3.5 rounded-xl border-2 text-[12px] font-semibold capitalize transition-all",
                form.calView === v.value
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Landing page */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Default Landing Page</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Which page opens after you log in</p>
        <div>
          <label htmlFor="pref-landing-page" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
            Landing page
          </label>
          <select
            id="pref-landing-page"
            value={form.landingPage}
            onChange={e => update("landingPage", e.target.value)}
            className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
          >
            <option value="/property-manager/portfolio">Portfolio (default)</option>
            <option value="/property-manager/work">Work</option>
            <option value="/property-manager/contacts">Contacts</option>
            <option value="/property-manager/money">Money</option>
            <option value="/property-manager/calendar">Calendar</option>
          </select>
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Accessibility</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Reduce visual motion and animation</p>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] font-medium text-slate-800">Reduce motion</p>
            <p className="text-[11.5px] text-slate-400">
              Minimise animations and transitions across the interface
            </p>
          </div>
          <button
            onClick={() => update("reducedMotion", !form.reducedMotion)}
            className={cn(
              "w-10 h-6 rounded-full transition-colors relative shrink-0",
              form.reducedMotion ? "bg-[#2563EB]" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                form.reducedMotion ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Guided help / product tour */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-24">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Product Tour &amp; Tips</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Show guided walkthroughs and first-use tips as you explore Propvora</p>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] font-medium text-slate-800">Guided tour &amp; tips</p>
            <p className="text-[11.5px] text-slate-400">
              Turn off to stop walkthrough pop-ups appearing on first use of each section
            </p>
          </div>
          <button
            onClick={() => setTourEnabled(!tourEnabled)}
            aria-pressed={tourEnabled}
            className={cn(
              "w-10 h-6 rounded-full transition-colors relative shrink-0",
              tourEnabled ? "bg-[#2563EB]" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                tourEnabled ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Sticky save bar */}
      {isDirty && !unavailable && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2 text-[13px] text-slate-600 hover:text-slate-900"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
