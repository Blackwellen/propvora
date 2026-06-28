"use client"

import Link from "next/link"
import { useFeatureFlag } from "@/hooks/useFeatureFlag"

// Renders the footer "Product" column, hiding the marketplace links (mk:true)
// until the marketplaceEnabled flag is on. Done client-side via useFeatureFlag
// so the footer (rendered in both server and client shells) never imports the
// server-only Supabase client.
export default function FooterProductLinks({
  links,
}: {
  links: { label: string; href: string; mk?: boolean }[]
}) {
  const marketplaceOn = useFeatureFlag("marketplaceEnabled")
  const visible = links.filter((l) => !l.mk || marketplaceOn)
  return (
    <ul className="space-y-2.5">
      {visible.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
