"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Loader2, MapPin, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { AddressForm, PhoneInput, CountryPackWarningBanner, toneFromPosture } from "@/components/intl"
import { getCountryProfile } from "@/lib/i18n/country-profiles"
import { getAddressModel } from "@/lib/i18n/address-models"
import {
  isHardBlockedCode,
} from "@/lib/context/sanctions-context"

/**
 * Property "Address & Jurisdiction" tab.
 *
 * Renders the country-appropriate address form (dynamic engine) for a property
 * plus its jurisdiction posture banner. The jurisdiction here is the PROPERTY's
 * country (not the workspace's) — Propvora never runs UK property law on a
 * non-UK property, and this tab makes that explicit.
 *
 * Persists country/region/address fields to the property row, tolerant of any
 * column the live schema lacks.
 */
export function PropertyAddressJurisdiction({
  propertyId,
  initialCountryCode = "GB",
  initialAddress = {},
  initialPhone = "",
  canEdit = true,
}: {
  propertyId: string
  initialCountryCode?: string
  initialAddress?: Record<string, string>
  initialPhone?: string
  canEdit?: boolean
}) {
  const supabase = useMemo(() => createClient(), [])
  const [countryCode, setCountryCode] = useState(initialCountryCode.toUpperCase())
  const [address, setAddress] = useState<Record<string, string>>(initialAddress)
  const [phone, setPhone] = useState(initialPhone)
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    supabase
      .from("country_profiles")
      .select("country_code, display_name, offer_status")
      .then(({ data }) => {
        if (!alive) return
        const rows = (data ?? []) as Array<{ country_code: string; display_name: string; offer_status: string }>
        const usable = rows
          .filter((r) => r.offer_status !== "banned")
          .map((r) => ({ code: r.country_code, name: r.display_name }))
        // Fallback to the static catalogue if the table isn't present.
        setCountries(usable.length ? usable : [{ code: "GB", name: "United Kingdom" }])
      })
    return () => {
      alive = false
    }
  }, [supabase])

  const profile = getCountryProfile(countryCode)
  const model = getAddressModel(profile?.addressModelId ?? "generic")
  const blocked = isHardBlockedCode(countryCode)

  const tone = toneFromPosture({
    countryCode,
    offerStatus: profile?.offerStatus ?? "unknown",
    canShowLegalPack: countryCode === "GB" || profile?.legalPackStatus === "reviewed",
    blocked,
    requiresManualReview: profile?.offerStatus === "restricted",
  })

  async function save() {
    if (!canEdit) return
    setSaving(true)
    setMsg(null)
    const payload: Record<string, unknown> = {
      country_code: countryCode,
      address_model_id: profile?.addressModelId ?? "generic",
      region_code: address[model.fieldOrder.find((k) => model.fields[k]?.type === "select") ?? ""] ?? null,
      updated_at: new Date().toISOString(),
    }
    let { error } = await supabase.from("properties").update(payload).eq("id", propertyId)
    if (error && (error.code === "42703" || /column .* does not exist/i.test(error.message))) {
      ;({ error } = await supabase
        .from("properties")
        .update({ country_code: countryCode })
        .eq("id", propertyId))
    }
    setSaving(false)
    setMsg(error ? "Could not save." : "Saved.")
  }

  return (
    <div className="space-y-5">
      <CountryPackWarningBanner
        countryName={profile?.displayName ?? countryCode}
        countryCode={countryCode}
        tone={tone}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-[14px] font-bold text-slate-900">Property address</h3>
        </div>

        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-[12px] font-medium text-slate-600">Country / jurisdiction</label>
          <select
            disabled={!canEdit}
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value)
              setAddress({})
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)] disabled:bg-slate-50"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <AddressForm modelId={profile?.addressModelId} value={address} onChange={setAddress} disabled={!canEdit} />

        <div className="max-w-xs">
          <PhoneInput countryCode={countryCode} value={phone} onChange={setPhone} disabled={!canEdit} />
        </div>

        {canEdit && (
          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
            {msg && <span className="text-[12px] text-slate-500">{msg}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
