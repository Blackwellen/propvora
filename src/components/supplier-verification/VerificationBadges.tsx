import React from "react"
import { Mail, Phone, CreditCard, IdCard, ShieldCheck, ScrollText } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import type { SupplierBadge, BadgeKey } from "@/lib/supplier-verification"

/**
 * Honest, evidence-reviewed verification badges for a supplier. Wording reflects
 * what was reviewed ONLY — never "government verified" or "fully vetted". Inactive
 * badges render muted so the supplier sees what is still outstanding.
 */

const BADGE_ICON: Record<BadgeKey, typeof Mail> = {
  email: Mail,
  phone: Phone,
  payout: CreditCard,
  id_evidence: IdCard,
  insurance: ShieldCheck,
  licence: ScrollText,
}

export default function VerificationBadges({ badges }: { badges: SupplierBadge[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => {
        const Icon = BADGE_ICON[b.key]
        return b.active ? (
          <Badge key={b.key} variant="success" size="md" className="gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            {b.label}
          </Badge>
        ) : (
          <span
            key={b.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#E2E8F0] px-2.5 py-0.5 text-xs text-slate-400"
          >
            <Icon className="w-3.5 h-3.5" />
            {b.label}
          </span>
        )
      })}
    </div>
  )
}
