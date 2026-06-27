"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import MobileTopBar from "@/components/mobile/MobileTopBar"

interface ProspectDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  status: string
  source: string | null
  budget_min: number | null
  budget_max: number | null
  move_in_date: string | null
  notes: string | null
  created_at: string
  property_vacancies?: { title: string | null; address: string | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  viewing_scheduled: "Viewing Scheduled",
  viewing_done: "Viewing Done",
  referencing: "Referencing",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
}

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [prospect, setProspect] = useState<ProspectDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("prospects")
        .select(`
          id, first_name, last_name, email, phone, status, source,
          budget_min, budget_max, move_in_date, notes, created_at,
          property_vacancies ( title, address )
        `)
        .eq("id", id)
        .maybeSingle()
      setProspect(data as ProspectDetail | null)
      setLoading(false)
    }
    load()
  }, [id])

  const name = prospect ? `${prospect.first_name} ${prospect.last_name}` : "Prospect"
  const budgetLabel = prospect?.budget_max
    ? `Up to £${Number(prospect.budget_max).toLocaleString("en-GB")}/pcm`
    : "—"

  return (
    <>
      <MobileTopBar title={name} showBack backHref="/property-manager/portfolio/leasing/prospects" />

      <div className="hidden md:flex items-center gap-3 bg-white border-b border-slate-200 px-6 py-4">
        <button onClick={() => router.push("/property-manager/portfolio/leasing/prospects")} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{name}</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {prospect ? (STATUS_LABELS[prospect.status] ?? prospect.status) : "Loading…"}
          </p>
        </div>
      </div>

      <div className="py-6 px-4 md:px-6 max-w-2xl">
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        )}

        {!loading && !prospect && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">Prospect not found.</p>
            <button onClick={() => router.push("/property-manager/portfolio/leasing/prospects")} className="mt-4 text-blue-600 text-sm font-medium hover:underline">
              Back to prospects
            </button>
          </div>
        )}

        {!loading && prospect && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Contact</h2>
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${prospect.email}`} className="hover:text-blue-600 transition-colors">{prospect.email}</a>
              </div>
              {prospect.phone && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${prospect.phone}`} className="hover:text-blue-600 transition-colors">{prospect.phone}</a>
                </div>
              )}
              {prospect.source && (
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Source: {prospect.source}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Requirements</h2>
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                Budget: {budgetLabel}
              </div>
              {prospect.move_in_date && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  Move-in: {new Date(prospect.move_in_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
              {prospect.property_vacancies && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  Vacancy: {prospect.property_vacancies.title ?? prospect.property_vacancies.address ?? "—"}
                </div>
              )}
            </div>

            {prospect.notes && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide mb-2">Notes</h2>
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{prospect.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
              <Clock className="w-3 h-3" />
              Added {new Date(prospect.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
