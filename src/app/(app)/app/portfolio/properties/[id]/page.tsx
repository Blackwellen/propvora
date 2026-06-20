"use client"
import React, { useState, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty, useUpdateProperty } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useJobs } from "@/hooks/useJobs"
import { useTasks } from "@/hooks/useTasks"
import { useContacts } from "@/hooks/useContacts"
import { createClient } from "@/lib/supabase/client"
import { uploadFile } from "@/lib/upload"
import { cn } from "@/lib/utils"
import MobileTabs from "@/components/mobile/MobileTabs"
import { Building2, ChevronLeft, RefreshCw } from "lucide-react"
import { useComplianceItems, useActivityLog } from "@/components/portfolio/property-detail/shared"
import { PropertyDetailHeader } from "@/components/portfolio/property-detail/PropertyDetailHeader"
import { OverviewTab } from "@/components/portfolio/property-detail/OverviewTab"
import { UnitsTab } from "@/components/portfolio/property-detail/UnitsTab"
import { TenanciesTab } from "@/components/portfolio/property-detail/TenanciesTab"
import { FinancesTab } from "@/components/portfolio/property-detail/FinancesTab"
import { ComplianceTab } from "@/components/portfolio/property-detail/ComplianceTab"
import { DocumentsTab } from "@/components/portfolio/property-detail/DocumentsTab"
import { ContactsTab } from "@/components/portfolio/property-detail/ContactsTab"
import { WorkTab } from "@/components/portfolio/property-detail/WorkTab"
import { ActivityTab } from "@/components/portfolio/property-detail/ActivityTab"
import { MapTab } from "@/components/portfolio/property-detail/MapTab"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "units", label: "Units" },
  { id: "tenancies", label: "Tenancies" },
  { id: "finances", label: "Finances" },
  { id: "compliance", label: "Compliance" },
  { id: "documents", label: "Documents" },
  { id: "contacts", label: "Contacts" },
  { id: "work", label: "Work" },
  { id: "activity", label: "Activity" },
  { id: "map", label: "Map" },
]

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState("overview")
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const { data: property, isLoading: propLoading } = useProperty(workspace?.id, propertyId)
  const { data: units = [], isLoading: unitsLoading } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [], isLoading: tenLoading } = useTenancies(workspace?.id, propertyId)
  const { data: jobs = [] } = useJobs(workspace?.id, { property_id: propertyId })
  const { data: tasks = [] } = useTasks(workspace?.id, { property_id: propertyId })
  const { data: contacts = [] } = useContacts(workspace?.id)
  const { items: complianceItems, loaded: complianceLoaded } = useComplianceItems(workspace?.id, propertyId)
  const updateProperty = useUpdateProperty()

  const unitsList = units
  const tenanciesList = tenancies

  const activityIds = React.useMemo(
    () => [propertyId, ...units.map((u) => u.id), ...tenancies.map((t) => t.id)],
    [propertyId, units, tenancies]
  )
  const { events: activityEvents, loaded: activityLoaded } = useActivityLog(workspace?.id, activityIds)

  const effectiveCoverUrl = coverImageUrl ?? property?.cover_image_url ?? null
  const isLoading = propLoading || unitsLoading || tenLoading

  async function save(field: string, value: unknown) {
    if (!workspace?.id) return
    await updateProperty.mutateAsync({ id: propertyId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  async function handleCoverUpload(file: File) {
    if (!workspace?.id || !propertyId) return
    setUploadingCover(true)
    setCoverError(null)
    try {
      const { url: publicUrl } = await uploadFile(file, workspace.id, "property-covers")
      const supabase = createClient()
      const { error } = await supabase
        .from("properties")
        .update({ cover_image_url: publicUrl })
        .eq("id", propertyId)
        .eq("workspace_id", workspace.id)
      if (error) throw new Error(error.message)
      setCoverImageUrl(publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cover upload failed"
      console.error("Cover upload failed:", err)
      setCoverError(msg)
    } finally {
      setUploadingCover(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-blue-600 animate-spin" />
          <p className="text-[13px] text-slate-500">Loading property…</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Property not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This property doesn't exist or you don't have access to it.</p>
          </div>
          <Link href="/app/portfolio/properties" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  const prop = property

  return (
    <div className="min-h-screen bg-slate-50/40">
      <PropertyDetailHeader prop={prop} propertyId={propertyId} onSave={save} />

      <div className="px-6 pb-8">
        {/* Tab bar — desktop strip (md+) */}
        <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-5 bg-white -mx-6 px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-[13px] font-medium px-4 py-3.5 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile — same tab state, scrollable segmented pills */}
        <div className="md:hidden mb-4">
          <MobileTabs
            tabs={TABS}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="Property sections"
          />
        </div>

        {/* Tab content */}
        <div className="mt-1">
          {activeTab === "overview" && (
            <OverviewTab
              prop={prop}
              unitsList={unitsList}
              tenanciesList={tenanciesList}
              complianceItems={complianceItems}
              complianceLoaded={complianceLoaded}
              activity={activityEvents}
              activityLoaded={activityLoaded}
              jobs={jobs}
              tasks={tasks}
              coverImageUrl={effectiveCoverUrl}
              onCoverUpload={handleCoverUpload}
              uploadingCover={uploadingCover}
              coverError={coverError}
              coverInputRef={coverInputRef}
              onSave={save}
              onGoTab={setActiveTab}
            />
          )}
          {activeTab === "units" && (
            <UnitsTab unitsList={unitsList} propertyId={propertyId} />
          )}
          {activeTab === "tenancies" && (
            <TenanciesTab propertyId={propertyId} tenanciesList={tenanciesList} unitsList={unitsList} />
          )}
          {activeTab === "finances" && (
            <FinancesTab tenanciesList={tenanciesList} unitsList={unitsList} prop={prop} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab items={complianceItems} loaded={complianceLoaded} propertyId={propertyId} />
          )}
          {activeTab === "documents" && (
            <DocumentsTab />
          )}
          {activeTab === "contacts" && (
            <ContactsTab contacts={contacts} />
          )}
          {activeTab === "activity" && (
            <ActivityTab events={activityEvents} loaded={activityLoaded} />
          )}
          {activeTab === "work" && (
            <WorkTab jobs={jobs} tasks={tasks} propertyId={propertyId} />
          )}
          {activeTab === "map" && (
            <MapTab prop={prop} />
          )}
        </div>
      </div>
    </div>
  )
}
