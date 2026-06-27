"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Sparkles,
  Home,
  BedDouble,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ACCOMMODATION_CATEGORIES,
  sectionsForCategory,
  FURNISHED_OPTIONS,
  DEPOSIT_SCHEMES,
  BILL_LABELS,
  SHARED_FACILITY_LABELS,
  AMENITY_GROUP_LABELS,
  type AccommodationCategory,
  type LetType,
  type TypeDetails,
  type Furnished,
  type DepositScheme,
  type BillsIncluded,
  type SharedFacilities,
  type CatalogueAmenity,
  type ListingAccommodation,
} from "@/lib/booking/accommodation"
import { KEYLESS_PROVIDERS, type KeylessProvider, type KeylessLock } from "@/lib/booking/keyless"
import { saveAccommodation, saveAmenitySelection, saveKeylessLock } from "./actions"

/* ──────────────────────────────────────────────────────────────────────────
   Type-aware accommodation step. Picks the accommodation category, then renders
   ONLY the field sets that category needs (short-stay vs long-let vs shared
   room), plus the catalogue-driven amenities picker and — for families that use
   self-check-in — the keyless lock config. Real persistence per sub-save.
   Styling matches the planning-set wizard (blue var(--brand) primary, slate fields).
─────────────────────────────────────────────────────────────────────────── */

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"

interface Props {
  listingId: string
  accommodation: ListingAccommodation
  amenityCatalogue: CatalogueAmenity[]
  selectedAmenitySlugs: string[]
  keylessLock: KeylessLock | null
  onSaved?: () => void
}

const LET_TYPES: { value: LetType; label: string }[] = [
  { value: "entire", label: "Entire place" },
  { value: "private_room", label: "Private room" },
  { value: "shared_room", label: "Shared room" },
]

export function AccommodationStep({
  listingId,
  accommodation,
  amenityCatalogue,
  selectedAmenitySlugs,
  keylessLock,
  onSaved,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  const [category, setCategory] = useState<AccommodationCategory>(accommodation.accommodationCategory)
  const [letType, setLetType] = useState<LetType>(accommodation.letType)
  const [details, setDetails] = useState<TypeDetails>(accommodation.typeDetails)
  const [amenitySlugs, setAmenitySlugs] = useState<string[]>(selectedAmenitySlugs)

  // keyless state
  const [provider, setProvider] = useState<KeylessProvider>(keylessLock?.provider ?? "manual_code")
  const [deviceRef, setDeviceRef] = useState(keylessLock?.deviceRef ?? "")
  const [instructions, setInstructions] = useState(keylessLock?.instructions ?? "")
  const [staticCode, setStaticCode] = useState("")

  const sections = useMemo(() => sectionsForCategory(category), [category])

  function notify(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function patch<K extends keyof TypeDetails>(key: K, value: TypeDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }))
  }
  function patchBill(key: keyof BillsIncluded, value: boolean) {
    setDetails((d) => ({ ...d, billsIncluded: { ...d.billsIncluded, [key]: value } }))
  }
  function patchFacility(key: keyof SharedFacilities, value: boolean) {
    setDetails((d) => ({ ...d, sharedFacilities: { ...d.sharedFacilities, [key]: value } }))
  }

  function saveType() {
    startTransition(async () => {
      const res = await saveAccommodation({
        listingId,
        accommodationCategory: category,
        letType,
        typeDetails: details,
      })
      if (res.ok) {
        notify("ok", "Accommodation details saved.")
        onSaved?.()
      } else {
        notify("err", res.error ?? "Could not save.")
      }
    })
  }

  function saveAmenities() {
    startTransition(async () => {
      const res = await saveAmenitySelection(listingId, amenitySlugs)
      res.ok ? notify("ok", "Amenities saved.") : notify("err", res.error ?? "Could not save amenities.")
      if (res.ok) onSaved?.()
    })
  }

  function saveKeyless() {
    startTransition(async () => {
      const res = await saveKeylessLock({
        listingId,
        provider,
        deviceRef: deviceRef || null,
        instructions: instructions || null,
        staticCode: staticCode || undefined,
      })
      if (res.ok) {
        notify("ok", "Keyless lock saved.")
        setStaticCode("")
        onSaved?.()
      } else {
        notify("err", res.error ?? "Could not save the lock.")
      }
    })
  }

  // Group catalogue amenities for the picker.
  const grouped = useMemo(() => {
    const m = new Map<string, CatalogueAmenity[]>()
    for (const a of amenityCatalogue) {
      const arr = m.get(a.category) ?? []
      arr.push(a)
      m.set(a.category, arr)
    }
    return [...m.entries()]
  }, [amenityCatalogue])

  function toggleAmenity(slug: string) {
    setAmenitySlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }

  const selectedMeta = ACCOMMODATION_CATEGORIES.find((c) => c.value === category)

  return (
    <div className="space-y-7">
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm",
            toast.kind === "ok" ? "bg-slate-900" : "bg-red-600"
          )}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Category picker */}
      <section className="space-y-3">
        <Header
          icon={Building2}
          title="Accommodation type"
          desc="This determines which details guests see and how they book — a nightly short-stay is a different product from a long-term tenancy."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ACCOMMODATION_CATEGORIES.map((c) => {
            const on = category === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value)
                  // adopt the category's default let type when switching families
                  setLetType(c.defaultLetType)
                }}
                className={cn(
                  "text-left rounded-xl border p-3 transition-colors",
                  on ? "border-[var(--brand)] bg-[var(--brand-soft)]/60 ring-1 ring-[var(--brand)]/30" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <p className={cn("text-[13.5px] font-semibold", on ? "text-[var(--brand-strong)]" : "text-slate-800")}>
                  {c.label}
                </p>
                <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">{c.description}</p>
              </button>
            )
          })}
        </div>

        <Field label="Let type">
          <div className="flex flex-wrap gap-2">
            {LET_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLetType(t.value)}
                className={cn(
                  "h-9 px-3 rounded-lg text-[13px] font-medium transition-colors",
                  letType === t.value
                    ? "bg-[var(--brand)] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>
      </section>

      {/* SHORT-STAY fields */}
      {sections.minMaxNights && (
        <section className="space-y-3">
          <Header icon={Home} title="Stay details" desc="Wi-Fi, arrival method and your nightly stay limits." />
          {sections.wifi && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Wi-Fi network name">
                <input
                  value={details.wifiName ?? ""}
                  onChange={(e) => patch("wifiName", e.target.value || null)}
                  className={inputCls}
                  placeholder="e.g. PROPVORA-5G"
                />
              </Field>
              <Field label="Wi-Fi password">
                <input
                  value={details.wifiPassword ?? ""}
                  onChange={(e) => patch("wifiPassword", e.target.value || null)}
                  className={inputCls}
                  placeholder="Shared with the guest after booking"
                />
              </Field>
            </div>
          )}
          <Field label="Check-in method">
            <input
              value={details.checkInMethod ?? ""}
              onChange={(e) => patch("checkInMethod", e.target.value || null)}
              className={inputCls}
              placeholder="e.g. Self check-in with a keypad"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum nights">
              <NumInput value={details.minNights} onChange={(n) => patch("minNights", n)} min={1} />
            </Field>
            <Field label="Maximum nights">
              <NumInput value={details.maxNights} onChange={(n) => patch("maxNights", n)} min={1} />
            </Field>
          </div>
        </section>
      )}

      {/* LONG / SHARED — tenancy + bills + furnished + deposit */}
      {(sections.tenancyLength || sections.bills) && (
        <section className="space-y-3">
          <Header
            icon={ScrollText}
            title="Tenancy & costs"
            desc="The information a long-stay or HMO tenant needs to decide and apply."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.tenancyLength && (
              <Field label="Tenancy length (months)">
                <NumInput
                  value={details.tenancyLengthMonths}
                  onChange={(n) => patch("tenancyLengthMonths", n)}
                  min={1}
                />
              </Field>
            )}
            {sections.room && (
              <Field label="Contract length (months)">
                <NumInput
                  value={details.contractLengthMonths}
                  onChange={(n) => patch("contractLengthMonths", n)}
                  min={1}
                />
              </Field>
            )}
            {sections.furnished && (
              <Field label="Furnishing">
                <select
                  value={details.furnished ?? ""}
                  onChange={(e) => patch("furnished", (e.target.value || null) as Furnished | null)}
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {FURNISHED_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {sections.availableFrom && (
              <Field label="Available from">
                <input
                  type="date"
                  value={details.availableFrom ?? ""}
                  onChange={(e) => patch("availableFrom", e.target.value || null)}
                  className={inputCls}
                />
              </Field>
            )}
          </div>

          {sections.bills && (
            <Field label="Bills included">
              <div className="flex flex-wrap gap-2">
                {BILL_LABELS.map((b) => {
                  const on = details.billsIncluded[b.key] === true
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => patchBill(b.key, !on)}
                      className={cn(
                        "h-9 px-3 rounded-lg text-[13px] font-medium transition-colors",
                        on ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {b.label}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          {sections.deposit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Deposit amount">
                <input
                  type="number"
                  min="0"
                  value={details.depositPence != null ? String(details.depositPence / 100) : ""}
                  onChange={(e) =>
                    patch(
                      "depositPence",
                      e.target.value.trim() === "" ? null : Math.round(parseFloat(e.target.value) * 100)
                    )
                  }
                  className={inputCls}
                  placeholder="e.g. 1200"
                />
              </Field>
              <Field label="Deposit scheme">
                <select
                  value={details.depositScheme ?? ""}
                  onChange={(e) => patch("depositScheme", (e.target.value || null) as DepositScheme | null)}
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {DEPOSIT_SCHEMES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Deposit protection declaration">
                  <textarea
                    rows={2}
                    value={details.depositDeclaration ?? ""}
                    onChange={(e) => patch("depositDeclaration", e.target.value || null)}
                    className={cn(inputCls, "h-auto py-2 resize-none")}
                    placeholder="e.g. Protected with the DPS within 30 days; prescribed information served."
                  />
                </Field>
              </div>
            </div>
          )}

          {(sections.epc || sections.councilTax) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.epc && (
                <Field label="EPC rating">
                  <input
                    value={details.epcRating ?? ""}
                    onChange={(e) => patch("epcRating", e.target.value || null)}
                    className={inputCls}
                    placeholder="A–G"
                    maxLength={2}
                  />
                </Field>
              )}
              {sections.councilTax && (
                <Field label="Council tax band">
                  <input
                    value={details.councilTaxBand ?? ""}
                    onChange={(e) => patch("councilTaxBand", e.target.value || null)}
                    className={inputCls}
                    placeholder="A–H"
                    maxLength={2}
                  />
                </Field>
              )}
            </div>
          )}

          {sections.floorPlan && (
            <Field label="Floor plan URL">
              <input
                value={details.floorPlanUrl ?? ""}
                onChange={(e) => patch("floorPlanUrl", e.target.value || null)}
                className={inputCls}
                placeholder="Link to a floor-plan image or PDF"
              />
            </Field>
          )}
        </section>
      )}

      {/* SHARED / HMO / student / co-living — room + shared facilities */}
      {sections.room && (
        <section className="space-y-3">
          <Header icon={BedDouble} title="Room & shared facilities" desc="What's private to this room and what's shared in the household." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Room size (m²)">
              <NumInput value={details.roomSizeSqm} onChange={(n) => patch("roomSizeSqm", n)} min={1} />
            </Field>
            <Field label="Household size">
              <NumInput value={details.householdSize} onChange={(n) => patch("householdSize", n)} min={1} />
            </Field>
            <Field label="En-suite">
              <div className="flex gap-2">
                {[
                  { v: true, l: "Yes" },
                  { v: false, l: "No" },
                ].map((o) => (
                  <button
                    key={o.l}
                    type="button"
                    onClick={() => patch("ensuite", o.v)}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-sm font-medium transition-colors",
                      details.ensuite === o.v
                        ? "bg-[var(--brand)] text-white"
                        : "bg-white text-slate-600 border border-slate-200"
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Shared facilities">
            <div className="flex flex-wrap gap-2">
              {SHARED_FACILITY_LABELS.map((f) => {
                const on = details.sharedFacilities[f.key] === true
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => patchFacility(f.key, !on)}
                    className={cn(
                      "h-9 px-3 rounded-lg text-[13px] font-medium transition-colors",
                      on ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </section>
      )}

      <SaveBar onSave={saveType} pending={pending} label={`Save ${selectedMeta?.label.toLowerCase() ?? "type"} details`} />

      {/* Amenities (catalogue-driven, all families) */}
      {sections.amenities && grouped.length > 0 && (
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <Header icon={Sparkles} title="Amenities" desc="Select everything this place offers — guests see these grouped with icons." />
          <div className="space-y-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  {AMENITY_GROUP_LABELS[group] ?? group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((a) => {
                    const on = amenitySlugs.includes(a.slug)
                    return (
                      <button
                        key={a.slug}
                        type="button"
                        onClick={() => toggleAmenity(a.slug)}
                        className={cn(
                          "h-9 px-3 rounded-lg text-[13px] font-medium transition-colors",
                          on ? "bg-[var(--brand)] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {a.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <SaveBar onSave={saveAmenities} pending={pending} label="Save amenities" />
        </section>
      )}

      {/* Keyless lock (short-stay + shared families) */}
      {sections.keyless && (
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <Header
            icon={KeyRound}
            title="Keyless entry"
            desc="Configure how guests get in. We issue a per-stay access code, released only after payment and within the stay window."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Provider">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as KeylessProvider)}
                className={inputCls}
              >
                {KEYLESS_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Device reference (smart locks)">
              <input
                value={deviceRef}
                onChange={(e) => setDeviceRef(e.target.value)}
                className={inputCls}
                placeholder="Vendor device ID"
              />
            </Field>
          </div>
          <Field label="Arrival instructions">
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={cn(inputCls, "h-auto py-2 resize-none")}
              placeholder="Where the lock is and how to use the code."
            />
          </Field>
          {(provider === "manual_code" || provider === "key_safe") && (
            <Field label="Static code (optional)">
              <input
                value={staticCode}
                onChange={(e) => setStaticCode(e.target.value)}
                className={inputCls}
                placeholder={keylessLock?.hasStaticCode ? "•••• (saved — leave blank to keep)" : "Fixed lockbox / keypad code"}
              />
            </Field>
          )}
          <p className="text-[11.5px] text-slate-400">
            {KEYLESS_PROVIDERS.find((p) => p.value === provider)?.hint}
          </p>
          <SaveBar onSave={saveKeyless} pending={pending} label="Save keyless lock" />
        </section>
      )}
    </div>
  )
}

function Header({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
        <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number | null
  onChange: (n: number | null) => void
  min?: number
  max?: number
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value.trim() === "" ? null : Number(e.target.value))}
      className={inputCls}
    />
  )
}

function SaveBar({ onSave, pending, label }: { onSave: () => void; pending: boolean; label: string }) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : label}
      </button>
    </div>
  )
}

export default AccommodationStep
