"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BedDouble, MapPin, Calendar, DollarSign, Users, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import MobileTopBar from "@/components/mobile/MobileTopBar"

interface VacancyDetail {
  id: string
  title: string | null
  address: string | null
  unit_ref: string | null
  bedrooms: number | null
  furnished: string | null
  asking_rent: number | null
  available_from: string | null
  status: string
  description: string | null
  created_at: string
  properties?: { nickname: string | null; address_line_1: string | null; city: string | null } | null
  prospects?: { id: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", active: "Active", under_offer: "Under Offer", let: "Let", withdrawn: "Withdrawn",
}

export default function VacancyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("property_vacancies")
        .select(`
          id, title, address, unit_ref, bedrooms, furnished,
          asking_rent, available_from, status, description, created_at,
          properties ( nickname, address_line_1, city ),
          prospects ( id )
        `)
        .eq("id", id)
        .maybeSingle()
      setVacancy(data as VacancyDetail | null)
      setLoading(false)
    }
    load()
  }, [id])

  const prop = vacancy?.properties
  const addressLabel = prop
    ? [prop.address_line_1, prop.city].filter(Boolean).join(", ")
    : (vacancy?.address ?? vacancy?.title ?? vacancy?.unit_ref ?? "—")

  return (
    <>
      <MobileTopBar title="Vacancy" showBack backHref="/property-manager/portfolio/leasing/vacancies" />

      <div className="hidden md:flex items-center gap-3 bg-white border-b border-slate-200 px-6 py-4">
        <button onClick={() => router.push("/property-manager/portfolio/leasing/vacancies")} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{addressLabel || "Vacancy"}</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{vacancy ? (STATUS_LABELS[vacancy.status] ?? vacancy.status) : "Loading…"}</p>
        </div>
      </div>

      <div className="py-6 px-4 md:px-6 max-w-2xl">
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
          </div>
        )}

        {!loading && !vacancy && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 text-sm">Vacancy not found.</p>
            <button onClick={() => router.push("/property-manager/portfolio/leasing/vacancies")} className="mt-4 text-blue-600 text-sm font-medium hover:underline">
              Back to vacancies
            </button>
          </div>
        )}

        {!loading && vacancy && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide mb-1">Details</h2>
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {addressLabel}
              </div>
              {vacancy.bedrooms != null && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <BedDouble className="w-4 h-4 text-slate-400 shrink-0" />
                  {vacancy.bedrooms} bedroom{vacancy.bedrooms !== 1 ? "s" : ""}
                  {vacancy.furnished ? ` · ${vacancy.furnished}` : ""}
                </div>
              )}
              {vacancy.asking_rent && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                  £{Number(vacancy.asking_rent).toLocaleString("en-GB")}/pcm
                </div>
              )}
              {vacancy.available_from && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  Available from {new Date(vacancy.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
              {(vacancy.prospects?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-[13px] text-slate-700">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  {vacancy.prospects!.length} prospect{vacancy.prospects!.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {vacancy.description && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide mb-2">Description</h2>
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
              </div>
            )}

            <div className="flex gap-2 px-1">
              <button
                onClick={() => router.push("/property-manager/portfolio/leasing/viewings")}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Schedule viewing
              </button>
              <button
                onClick={() => router.push("/property-manager/portfolio/tenancies/new")}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Mark as let
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
              <Clock className="w-3 h-3" />
              Added {new Date(vacancy.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
