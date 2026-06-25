import { type PpmWizardData, ppmSelectClass, ppmLabelClass } from "./ppm-wizard-shared"

interface PpmStepPropertyProps {
  data: PpmWizardData
  onChange: (d: Partial<PpmWizardData>) => void
  properties: { id: string; name: string }[]
  propertiesLoading: boolean
  units: { id: string; unit_name: string }[]
  unitsLoading: boolean
}

export function PpmStepProperty({ data, onChange, properties, propertiesLoading, units, unitsLoading }: PpmStepPropertyProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={ppmLabelClass}>Property</label>
          <select
            value={data.propertyId}
            onChange={(e) => {
              const prop = properties.find((p) => p.id === e.target.value)
              onChange({ propertyId: e.target.value, propertyName: prop?.name ?? "", unitId: "", unitName: "" })
            }}
            disabled={propertiesLoading}
            className={ppmSelectClass}
          >
            <option value="">{propertiesLoading ? "Loading properties…" : "Select property…"}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={ppmLabelClass}>Asset / unit</label>
          <select
            value={data.unitId}
            onChange={(e) => {
              const unit = units.find((u) => u.id === e.target.value)
              onChange({ unitId: e.target.value, unitName: unit?.unit_name ?? "" })
            }}
            disabled={!data.propertyId || unitsLoading}
            className={ppmSelectClass}
          >
            <option value="">{data.propertyId ? (unitsLoading ? "Loading units…" : "Select unit…") : "Select a property first"}</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!propertiesLoading && properties.length === 0 && (
        <p className="text-[12px] text-slate-500">
          No properties found yet. You can still create the plan and link a property later.
        </p>
      )}
    </div>
  )
}
