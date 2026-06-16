import { Sparkles } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import RecipesClient from "@/components/automations-engine/RecipesClient"

export const metadata = {
  title: "Automation recipes - Propvora",
  description: "Curated automation recipes across booking, supplier, marketplace, money, compliance, legal, and customer ops.",
}
export const dynamic = "force-dynamic"

export default function AutomationRecipesPage() {
  return (
    <div className="space-y-6">
      <OpsHeader icon={Sparkles} title="Smart recipes" subtitle="Install a curated automation as a disabled draft, then review and enable it." />
      <RecipesClient />
    </div>
  )
}
