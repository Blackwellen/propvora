"use client"

import React from "react"
import {
  Home,
  CalendarRange,
  Globe,
  Building2,
  Sparkles,
  Map as MapIcon,
} from "lucide-react"
import LocationMap from "@/components/maps/LocationMap"
import { cn } from "@/lib/utils"
import { useListingDraft } from "../data/useListingDraft"
import { useProperties } from "../data/useProperties"
import { ACCOMMODATION_TYPES, ESSENTIAL_AMENITIES } from "../data/seed"
import type { ChannelKey, ListingType } from "../data/types"
import {
  Card,
  SectionTitle,
  FieldLabel,
  TextInput,
  TextArea,
  CharCounter,
  Select,
  Stepper,
  ToggleChip,
  RemovableChip,
  AddChipInput,
} from "../components/primitives"

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "direct", label: "Direct (Propvora)" },
  { key: "airbnb", label: "Airbnb" },
  { key: "booking", label: "Booking.com" },
  { key: "vrbo", label: "Vrbo" },
  { key: "google", label: "Google" },
]

export function BasicsStep() {
  const { draft, update } = useListingDraft()
  const properties = useProperties()

  const toggleChannel = (key: ChannelKey) => {
    const has = draft.channels.includes(key)
    update({
      channels: has
        ? draft.channels.filter((c) => c !== key)
        : [...draft.channels, key],
    })
  }

  const toggleAmenity = (key: string) =>
    update({
      amenities: draft.amenities.map((a) =>
        a.key === key ? { ...a, on: !a.on } : a,
      ),
    })

  const addHighlight = (label: string) =>
    update({
      highlights: [...draft.highlights, { id: `h-${Date.now()}`, label }],
    })
  const removeHighlight = (id: string) =>
    update({ highlights: draft.highlights.filter((h) => h.id !== id) })

  const addCustomAmenity = (label: string) =>
    update({
      amenities: [...draft.amenities, { key: `am-${Date.now()}`, label, on: true }],
    })

  return (
    <div className="space-y-5">
      {/* Listing type */}
      <Card>
        <SectionTitle title="Listing type" hint="How will guests stay at this property?" />
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { key: "short-term", label: "Short-term stay", desc: "Nightly bookings, holiday lets", Icon: Home },
              { key: "long-term", label: "Long-term let", desc: "Monthly tenancies, AST", Icon: CalendarRange },
            ] as { key: ListingType; label: string; desc: string; Icon: React.ElementType }[]
          ).map((t) => {
            const active = draft.listingType === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => update({ listingType: t.key })}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                  active
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <t.Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-400")} />
                <span className="text-[13px] font-bold text-slate-900">{t.label}</span>
                <span className="text-[11px] text-slate-500">{t.desc}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Channel type */}
      <Card>
        <SectionTitle title="Distribution channels" hint="Direct booking plus any OTAs to sync" />
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <ToggleChip
              key={c.key}
              on={draft.channels.includes(c.key)}
              onClick={() => toggleChannel(c.key)}
            >
              <Globe className="h-3 w-3" />
              {c.label}
            </ToggleChip>
          ))}
        </div>
      </Card>

      {/* Property + title + description */}
      <Card>
        <SectionTitle title="Listing details" />
        <div className="space-y-4">
          <div>
            <FieldLabel>Select property</FieldLabel>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <select
                value={draft.propertyId ?? ""}
                onChange={(e) => {
                  const opt = properties.data.find((p) => p.id === e.target.value)
                  update({
                    propertyId: e.target.value || null,
                    propertyLabel: opt?.label ?? "",
                  })
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] font-medium text-slate-900 outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
              >
                <option value="">Choose a property…</option>
                {properties.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.address}
                  </option>
                ))}
              </select>
            </div>
            {properties.source === "seed" && (
              <p className="mt-1 text-[11px] text-slate-400">Showing sample properties</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>Listing title</FieldLabel>
              <CharCounter value={draft.title} max={60} />
            </div>
            <TextInput
              value={draft.title}
              onChange={(v) => update({ title: v })}
              maxLength={60}
              placeholder="e.g. Riverside Loft with Skyline Views"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>Short description</FieldLabel>
              <CharCounter value={draft.shortDescription} max={180} />
            </div>
            <TextArea
              value={draft.shortDescription}
              onChange={(v) => update({ shortDescription: v })}
              maxLength={180}
              rows={3}
              placeholder="Sum up the stay in a sentence or two…"
            />
          </div>
        </div>
      </Card>

      {/* Space */}
      <Card>
        <SectionTitle title="The space" />
        <div className="space-y-4">
          <div>
            <FieldLabel>Accommodation type</FieldLabel>
            <Select
              value={draft.accommodationType}
              onChange={(v) => update({ accommodationType: v })}
              options={ACCOMMODATION_TYPES}
            />
          </div>
          <div>
            <FieldLabel>Guest capacity</FieldLabel>
            <Stepper
              value={draft.guestCapacity}
              onChange={(v) => update({ guestCapacity: v })}
              min={1}
              max={30}
              label="Maximum guests"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Bedrooms</FieldLabel>
              <Stepper value={draft.bedrooms} onChange={(v) => update({ bedrooms: v })} />
            </div>
            <div>
              <FieldLabel>Bathrooms</FieldLabel>
              <Stepper value={draft.bathrooms} onChange={(v) => update({ bathrooms: v })} />
            </div>
            <div>
              <FieldLabel>Beds</FieldLabel>
              <Stepper value={draft.beds} onChange={(v) => update({ beds: v })} />
            </div>
          </div>
        </div>
      </Card>

      {/* Address + map */}
      <Card>
        <SectionTitle
          title="Location"
          action={
            <button
              type="button"
              onClick={() => update({ lat: 53.4808, lng: -2.2426 })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <MapIcon className="h-3 w-3" /> Edit on map
            </button>
          }
        />
        <div className="space-y-3">
          <div>
            <FieldLabel>Address</FieldLabel>
            <TextInput
              value={draft.addressLine}
              onChange={(v) => update({ addressLine: v })}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput value={draft.city} onChange={(v) => update({ city: v })} />
            </div>
            <div>
              <FieldLabel>Postcode</FieldLabel>
              <TextInput value={draft.postcode} onChange={(v) => update({ postcode: v })} />
            </div>
          </div>
          {/* Live location map — uses stored coordinates, geocodes the postcode otherwise */}
          <LocationMap
            markers={[{
              id: "pin",
              lat: draft.lat,
              lng: draft.lng,
              address: !draft.lat && draft.postcode ? draft.postcode : null,
              label: "Property location",
              sublabel: draft.postcode || undefined,
            }]}
            height={144}
            zoom={15}
          />
        </div>
      </Card>

      {/* Neighbourhood */}
      <Card>
        <SectionTitle
          title="Neighbourhood"
          action={
            <button
              type="button"
              onClick={() =>
                update({
                  neighbourhoodSummary:
                    draft.neighbourhoodSummary ||
                    "Lively district with cafés, transport links and green space nearby.",
                })
              }
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Edit neighbourhood
            </button>
          }
        />
        <TextArea
          value={draft.neighbourhoodSummary}
          onChange={(v) => update({ neighbourhoodSummary: v })}
          rows={3}
          placeholder="What's it like to stay here?"
        />
      </Card>

      {/* Highlights */}
      <Card>
        <SectionTitle title="Key highlights" hint="Short selling points shown on the card" />
        {draft.highlights.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {draft.highlights.map((h) => (
              <RemovableChip key={h.id} label={h.label} onRemove={() => removeHighlight(h.id)} />
            ))}
          </div>
        )}
        <AddChipInput placeholder="Add a highlight…" onAdd={addHighlight} />
      </Card>

      {/* Amenities */}
      <Card>
        <SectionTitle
          title="Essential amenities"
          hint="Toggle the amenities this listing offers"
          action={<Sparkles className="h-4 w-4 text-amber-400" />}
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {draft.amenities.map((a) => (
            <ToggleChip key={a.key} on={a.on} onClick={() => toggleAmenity(a.key)}>
              {a.label}
            </ToggleChip>
          ))}
        </div>
        <AddChipInput placeholder="Add a custom amenity…" onAdd={addCustomAmenity} />
        <p className="mt-2 text-[11px] text-slate-400">
          Suggested: {ESSENTIAL_AMENITIES.slice(0, 4).join(", ")}…
        </p>
      </Card>
    </div>
  )
}
