import {
  Home,
  Building2,
  Users,
  FileText,
  Tag,
  Rocket,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Type", icon: Home },
  { n: 2, label: "Property", icon: Building2 },
  { n: 3, label: "Rooms", icon: Users },
  { n: 4, label: "Summary", icon: FileText },
  { n: 5, label: "Pricing", icon: Tag },
  { n: 6, label: "Done", icon: Rocket },
] as const

interface WizardProgressStepperProps {
  currentStep: number
}

export function WizardProgressStepper({ currentStep }: WizardProgressStepperProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map(({ n, label, icon: Icon }) => (
        <div key={n} className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors",
              currentStep === n
                ? "bg-[var(--brand)] text-white"
                : currentStep > n
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {currentStep > n ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {label}
          </div>
          {n < 6 && <span className="text-slate-200 text-xs">›</span>}
        </div>
      ))}
    </div>
  )
}
