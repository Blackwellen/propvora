"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { Plus, ArrowUpRight, Users, Eye, Search } from "lucide-react"
import { Card, getAvatarColor } from "./shared"

export function ContactsTab({ contacts }: { contacts: import("@/types/database").Contact[] }) {
  const [search, setSearch] = useState("")
  const filtered = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--color-brand-400)]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/property-manager/contacts/new" className="flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add Contact
          </Link>
          <Link href="/property-manager/contacts" className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            Open Contacts <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Users size={26} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">No contacts yet</p>
            <p className="text-[12px] text-slate-500 mt-1">Add tenants, suppliers and owners in the Contacts section.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Name", "Type", "Company", "Email", "Phone", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/property-manager/contacts/${c.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(c.full_name) }}>
                          {c.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span className="font-medium text-[var(--brand)] group-hover:underline">{c.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{c.contact_type?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.company_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email ? <a href={`mailto:${c.email}`} className="text-[var(--brand)] hover:underline">{c.email}</a> : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone ? <a href={`tel:${c.phone}`} className="text-[var(--brand)] hover:underline">{c.phone}</a> : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu align="right" items={[
                          { label: "View contact", icon: Eye, onClick: () => { window.location.href = `/property-manager/contacts/${c.id}` } },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
