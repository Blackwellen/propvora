import React from "react"
import Link from "next/link"
import { ArrowLeft, Languages } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listTranslationNamespaces } from "@/lib/international/control-plane"
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/i18n/config"

export const dynamic = "force-dynamic"

export default async function AdminTranslationsPage() {
  const namespaces = await listTranslationNamespaces()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/global"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Global control plane
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-500" /> Translation manager
        </h1>
        <p className="text-sm text-slate-500">
          Catalogue namespaces and the locales Propvora can render. en-GB is the source catalogue;
          every other locale is machine-seeded and must be reviewed before it is shown.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-[14px] font-bold text-slate-900 mb-3">Supported locales</h2>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LOCALES.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-700"
            >
              {LOCALE_META[loc]?.label ?? loc}
              {loc === "en-GB" && <Badge variant="success" size="sm">source</Badge>}
            </span>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">Namespaces</h2>
        </div>
        {namespaces.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-slate-500">
            No translation namespaces provisioned.
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {namespaces.map((ns) => (
              <li key={ns.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{ns.id}</p>
                  <p className="text-[12px] text-slate-500">{ns.description ?? "—"}</p>
                </div>
                <Badge variant="outline" size="sm">{ns.id}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
