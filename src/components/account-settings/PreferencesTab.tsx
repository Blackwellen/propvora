"use client"

import React, { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { useGuidedHelp } from "@/guided-help/GuidedHelpProvider"
import { Toggle, PREF_FIELDS } from "./shared"

export default function PreferencesTab() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({
    locale:           "en-GB",
    date_format:      "DD/MM/YYYY",
    currency_display: "GBP",
    timezone:         "Europe/London",
  })

  const { enabled: tourEnabled, setEnabled: setTourEnabled } = useGuidedHelp()

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("profiles")
          .select("locale, date_format, currency_display, timezone")
          .eq("id", user.id)
          .maybeSingle()
        if (data) {
          setVals(v => ({
            ...v,
            locale:           (data.locale as string)           || v.locale,
            date_format:      (data.date_format as string)      || v.date_format,
            currency_display: (data.currency_display as string) || v.currency_display,
            timezone:         (data.timezone as string)         || v.timezone,
          }))
        }
      } catch { /* defaults */ }
    })()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({
          locale:           vals.locale,
          date_format:      vals.date_format,
          currency_display: vals.currency_display,
          timezone:         vals.timezone,
        }).eq("id", user.id)
      }
      setSaved(true)
    } catch { /* non-fatal */ } finally { setSaving(false) }
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Product tour toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
        <div>
          <p className="text-sm font-medium text-slate-900">Product tour &amp; tips</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Show guided walkthroughs and first-use tips as you explore Propvora.
          </p>
        </div>
        <Toggle checked={tourEnabled} onChange={setTourEnabled} />
      </div>

      {/* Locale / format selects */}
      {PREF_FIELDS.map(pref => (
        <div key={pref.key} className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{pref.label}</label>
          <select
            value={vals[pref.key]}
            onChange={e => setVals(v => ({ ...v, [pref.key]: e.target.value }))}
            className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] appearance-none"
          >
            {pref.options.map(o => (
              <option key={o} value={o}>
                {(pref.labels as Record<string, string>)[o] ?? o}
              </option>
            ))}
          </select>
        </div>
      ))}

      <Button
        variant="primary"
        loading={saving}
        onClick={handleSave}
        className="mt-2"
        leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}
      >
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  )
}
