import {
  Banknote,
  Sofa,
  ShieldCheck,
  Map as MapIcon,
  Leaf,
  Landmark,
  CalendarClock,
  Ruler,
  DoorOpen,
  Users2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  BILL_LABELS,
  SHARED_FACILITY_LABELS,
  FURNISHED_OPTIONS,
  DEPOSIT_SCHEMES,
  type TypeDetails,
  type CategorySections,
} from "@/lib/booking/accommodation"

/* ──────────────────────────────────────────────────────────────────────────
   Public, type-aware accommodation detail sections. Server component (no client
   JS). The stay detail page renders this for long-let / mid-term / shared / HMO
   / student / co-living listings — short-stays keep the existing amenities +
   check-in + rules layout. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

function fmtMoney(pence: number | null, currency: string): string {
  if (pence == null) return "—"
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100)
  } catch {
    return `£${(pence / 100).toFixed(0)}`
  }
}

export function AccommodationDetails({
  details,
  sections,
  currency,
}: {
  details: TypeDetails
  sections: CategorySections
  currency: string
}) {
  const furnishedLabel = FURNISHED_OPTIONS.find((o) => o.value === details.furnished)?.label ?? null
  const schemeLabel = DEPOSIT_SCHEMES.find((s) => s.value === details.depositScheme)?.label ?? null
  const includedBills = BILL_LABELS.filter((b) => details.billsIncluded[b.key] === true)
  const facilities = SHARED_FACILITY_LABELS.filter((f) => details.sharedFacilities[f.key] === true)

  return (
    <div className="space-y-7">
      {/* Tenancy summary chips (long + shared) */}
      {(sections.tenancyLength || sections.availableFrom || sections.furnished) && (
        <section>
          <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">Letting details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sections.tenancyLength && details.tenancyLengthMonths != null && (
              <Fact icon={CalendarClock} label="Minimum tenancy" value={`${details.tenancyLengthMonths} months`} />
            )}
            {sections.room && details.contractLengthMonths != null && (
              <Fact icon={CalendarClock} label="Contract length" value={`${details.contractLengthMonths} months`} />
            )}
            {sections.availableFrom && details.availableFrom && (
              <Fact icon={CalendarClock} label="Available from" value={details.availableFrom} />
            )}
            {sections.furnished && furnishedLabel && (
              <Fact icon={Sofa} label="Furnishing" value={furnishedLabel} />
            )}
            {sections.epc && details.epcRating && (
              <Fact icon={Leaf} label="EPC rating" value={details.epcRating.toUpperCase()} />
            )}
            {sections.councilTax && details.councilTaxBand && (
              <Fact icon={Landmark} label="Council tax band" value={details.councilTaxBand.toUpperCase()} />
            )}
          </div>
        </section>
      )}

      {/* Bills included */}
      {sections.bills && (
        <section>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#0B1B3F] mb-3">
            <Banknote className="w-4 h-4 text-[var(--brand-strong)]" /> Bills
          </h2>
          {includedBills.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
              {BILL_LABELS.map((b) => {
                const on = details.billsIncluded[b.key] === true
                return (
                  <li key={b.key} className="flex items-center gap-2 text-[13.5px]">
                    {on ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={on ? "text-slate-700" : "text-slate-400"}>{b.label}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[13.5px] text-slate-500">Bills are not included — the tenant pays utilities directly.</p>
          )}
        </section>
      )}

      {/* Deposit */}
      {sections.deposit && (details.depositPence != null || schemeLabel || details.depositDeclaration) && (
        <section className="rounded-xl border border-[#EEF3FB] px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#0B1B3F] mb-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-strong)]" /> Deposit
          </h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13.5px] text-slate-600">
            {details.depositPence != null && (
              <span>
                <span className="font-semibold text-[#0B1B3F]">{fmtMoney(details.depositPence, currency)}</span> deposit
              </span>
            )}
            {schemeLabel && <span>Protected with {schemeLabel}</span>}
          </div>
          {details.depositDeclaration && (
            <p className="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">{details.depositDeclaration}</p>
          )}
        </section>
      )}

      {/* Room (shared families) */}
      {sections.room && (
        <section>
          <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">Your room</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {details.roomSizeSqm != null && (
              <Fact icon={Ruler} label="Room size" value={`${details.roomSizeSqm} m²`} />
            )}
            {details.ensuite != null && (
              <Fact icon={DoorOpen} label="En-suite" value={details.ensuite ? "Yes" : "Shared bathroom"} />
            )}
            {details.householdSize != null && (
              <Fact icon={Users2} label="Household" value={`${details.householdSize} people`} />
            )}
          </div>
        </section>
      )}

      {/* Shared facilities */}
      {sections.sharedFacilities && facilities.length > 0 && (
        <section>
          <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">Shared facilities</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {facilities.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-[13.5px] text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {f.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Floor plan */}
      {sections.floorPlan && details.floorPlanUrl && (
        <section>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#0B1B3F] mb-3">
            <MapIcon className="w-4 h-4 text-[var(--brand-strong)]" /> Floor plan
          </h2>
          <a
            href={details.floorPlanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            <MapIcon className="w-4 h-4" /> View floor plan
          </a>
        </section>
      )}
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#EEF3FB] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="text-[14px] font-semibold text-[#0B1B3F]">{value}</p>
    </div>
  )
}

export default AccommodationDetails
