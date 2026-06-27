import { Bell, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { type PpmWizardData, PPM_FREQUENCIES, PPM_REMINDER_OPTIONS, ppmInputClass, ppmSelectClass, ppmLabelClass } from "./ppm-wizard-shared"

interface PpmStepScheduleProps {
  data: PpmWizardData
  onChange: (d: Partial<PpmWizardData>) => void
}

export function PpmStepSchedule({ data, onChange }: PpmStepScheduleProps) {
  // A next-due-date earlier than the start date is contradictory — surface it
  // inline so the user fixes it before the Review step.
  const dateConflict =
    data.startDate && data.nextDueDate && data.nextDueDate < data.startDate

  function toggleReminder(days: number) {
    const next = data.reminders.includes(days)
      ? data.reminders.filter((d) => d !== days)
      : [...data.reminders, days].sort((a, b) => b - a)
    onChange({ reminders: next })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={ppmLabelClass}>
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={data.frequency}
            onChange={(e) => onChange({ frequency: e.target.value })}
            className={ppmSelectClass}
          >
            <option value="">Select frequency…</option>
            {PPM_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={ppmLabelClass}>Start date</label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className={ppmInputClass}
          />
        </div>
      </div>

      <div>
        <label className={ppmLabelClass}>
          Next due date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={data.nextDueDate}
          min={data.startDate || undefined}
          onChange={(e) => onChange({ nextDueDate: e.target.value })}
          className={ppmInputClass}
        />
        {dateConflict && (
          <p className="text-[11px] text-red-500 mt-1">Next due date cannot be before the start date.</p>
        )}
      </div>

      <div>
        <label className={cn(ppmLabelClass, "flex items-center gap-1.5")}>
          <Bell className="w-3.5 h-3.5 text-slate-500" />
          Reminders
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PPM_REMINDER_OPTIONS.map((o) => {
            const active = data.reminders.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleReminder(o.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {active && <Check className="w-3.5 h-3.5" />}
                {o.label}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {data.reminders.length > 0
            ? "We'll send an in-app notification on each selected day before the plan is due."
            : "No reminders — the plan still appears in due/overdue lists."}
        </p>
      </div>
    </div>
  )
}
