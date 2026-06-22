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
import { uploadFile, validateUploadFile } from "@/lib/upload"
import ImageCropModal from "@/components/upload/ImageCropModal"
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
import { useCountryTabs } from "@/lib/i18n/use-country-tabs"

// Keys that map to the "tenancies" content (different labels per country)
const TENANCY_KEYS = new Set([
  "tenancies", "leases_us", "tenancy_agreements", "mietvertraege",
  "tenancy_contracts", "tenancies_ca",
])

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()
  const countryTabs = useCountryTabs("portfolio")
  // Build MobileTabs-compatible format from countryTabs
  const TABS = countryTabs.map(t => ({ id: t.key, label: t.label }))
  const [activeTab, setActiveTab] = useState("overview")
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
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

  // A file was chosen — validate, then open the cropper (16:9 cover, no squash).
  async function handleCoverUpload(file: File) {
    const err = validateUploadFile(file, { imagesOnly: true })
    if (err) { setCoverError(err); return }
    setCoverError(null)
    setPendingCoverFile(file)
  }

  // The cropped result is what actually uploads.
  async function doCoverUpload(file: File) {
    setPendingCoverFile(null)
    if (!workspace?.id || !propertyId) return
    setUploadingCover(true)
    setCoverError(null)
    try {
      const { url: publicUrl } = await uploadFile(file, workspace.id, "property-covers", { imagesOnly: true })
      // Persist via the same validated mutation other edits use — it invalidates
      // the property cache so the new cover renders immediately (the raw client
      // .update() did neither reliably).
      await updateProperty.mutateAsync({ id: propertyId, workspaceId: workspace.id, payload: { cover_image_url: publicUrl } })
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
          <Link href="/property-manager/portfolio/properties" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
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
          {/* Tenancy tab: key varies per country (leases_us, tenancy_agreements, mietvertraege, etc.) */}
          {TENANCY_KEYS.has(activeTab) && (
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
          {/* Country-specific placeholder tabs (hmo, betriebskosten_prop, bond_au_prop, ejari_prop, fair_housing_us) */}
          {(activeTab === "hmo" ||
            activeTab === "betriebskosten_prop" ||
            activeTab === "bond_au_prop" ||
            activeTab === "ejari_prop" ||
            activeTab === "fair_housing_us") && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm font-medium text-slate-700 mb-1">
                {countryTabs.find(t => t.key === activeTab)?.label}
              </p>
              <p className="text-xs text-slate-500">
                This section is coming soon for your jurisdiction.
              </p>
            </div>
          )}
        </div>
      </div>

      <ImageCropModal
        file={pendingCoverFile}
        aspect={16 / 9}
        title="Crop cover image"
        onCancel={() => setPendingCoverFile(null)}
        onCropped={doCoverUpload}
      />
    </div>
  )
}
