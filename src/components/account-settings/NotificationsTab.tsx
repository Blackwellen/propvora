"use client"

import React, { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { Toggle, NOTIFICATIONS } from "./shared"

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map(n => [n.id, true]))
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .maybeSingle()
        const stored = (data?.preferences as { notifications?: Record<string, boolean> } | null)?.notifications
        if (stored) setPrefs(p => ({ ...p, ...stored }))
      } catch { /* defaults */ }
    })()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle()
        const existing = (data?.preferences as Record<string, unknown> | null) ?? {}
        await supabase.from("profiles").update({ preferences: { ...existing, notifications: prefs } }).eq("id", user.id)
      }
      setSaved(true)
    } catch { /* non-fatal */ } finally { setSaving(false) }
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {NOTIFICATIONS.map(n => (
          <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <p className="text-sm font-medium text-slate-900">{n.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
            </div>
            <Toggle checked={prefs[n.id]} onChange={v => setPrefs(p => ({ ...p, [n.id]: v }))} />
          </div>
        ))}
      </div>
      <Button
        variant="primary"
        loading={saving}
        onClick={handleSave}
        leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}
      >
        {saved ? "Preferences Saved!" : "Save Preferences"}
      </Button>
    </div>
  )
}
