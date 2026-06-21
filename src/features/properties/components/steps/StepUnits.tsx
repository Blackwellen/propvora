"use client"

import { Plus, Trash2, Layers } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface Unit {
  id: string
  name: string
  type: string
  targetRent: number
}

interface StepUnitsData {
  units: Unit[]
}

interface StepUnitsProps {
  data: StepUnitsData
  onChange: (d: Partial<StepUnitsData>) => void
}

export function StepUnits({ data, onChange }: StepUnitsProps) {
  function addUnit() {
    onChange({
      units: [
        ...data.units,
        { id: Date.now().toString(), name: `Room ${data.units.length + 1}`, type: "Room", targetRent: 500 },
      ],
    })
  }

  function removeUnit(id: string) {
    onChange({ units: data.units.filter((u) => u.id !== id) })
  }

  function updateUnit(id: string, updates: Partial<Unit>) {
    onChange({ units: data.units.map((u) => (u.id === id ? { ...u, ...updates } : u)) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Add rooms/units for HMO or multi-unit properties.</p>
        <Button variant="outline" size="sm" onClick={addUnit}>
          <Plus className="w-4 h-4" />
          Add unit
        </Button>
      </div>

      {data.units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <Layers className="w-8 h-8 text-slate-200" />
          <p className="text-sm text-slate-500">No units added yet</p>
          <Button variant="soft" size="sm" onClick={addUnit}>
            <Plus className="w-4 h-4" />
            Add first unit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.units.map((unit) => (
            <div key={unit.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50">
              <input
                type="text"
                value={unit.name}
                onChange={(e) => updateUnit(unit.id, { name: e.target.value })}
                className="flex-1 h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Room name"
              />
              <select
                value={unit.type}
                onChange={(e) => updateUnit(unit.id, { type: e.target.value })}
                className="h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
              >
                <option>Room</option>
                <option>En-suite</option>
                <option>Studio</option>
                <option>1-bed flat</option>
              </select>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">£</span>
                <input
                  type="number"
                  value={unit.targetRent}
                  onChange={(e) => updateUnit(unit.id, { targetRent: Number(e.target.value) })}
                  className="w-24 h-8 pl-5 pr-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  placeholder="500"
                />
              </div>
              <button
                onClick={() => removeUnit(unit.id)}
                className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg">
            <span className="text-sm text-slate-600">Total target rent</span>
            <span className="text-sm font-semibold text-[#10B981]">
              £{data.units.reduce((s, u) => s + u.targetRent, 0).toLocaleString()}/mo
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
