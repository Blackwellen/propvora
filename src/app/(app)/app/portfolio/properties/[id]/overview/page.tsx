"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useUpdateProperty } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useJobs } from "@/hooks/useJobs"
import { useTasks } from "@/hooks/useTasks"
import { uploadFile, validateUploadFile } from "@/lib/upload"
import ImageCropModal from "@/components/upload/ImageCropModal"
import { useComplianceItems, useActivityLog } from "@/components/portfolio/property-detail/shared"
import { OverviewTab } from "@/components/portfolio/property-detail/OverviewTab"

export default function PropertyOverviewPage() {
  const { propertyId, prop, save } = usePropertyDetailCtx()
  const router = useRouter()
  const { workspace } = useWorkspace()
  const updateProperty = useUpdateProperty()

  const { data: units = [] } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [] } = useTenancies(workspace?.id, propertyId)
  const { data: jobs = [] } = useJobs(workspace?.id, { property_id: propertyId })
  const { data: tasks = [] } = useTasks(workspace?.id, { property_id: propertyId })
  const { items: complianceItems, loaded: complianceLoaded } = useComplianceItems(workspace?.id, propertyId)

  const activityIds = React.useMemo(
    () => [propertyId, ...units.map((u) => u.id), ...tenancies.map((t) => t.id)],
    [propertyId, units, tenancies]
  )
  const { events: activityEvents, loaded: activityLoaded } = useActivityLog(workspace?.id, activityIds)

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  if (!prop) return null
  const effectiveCoverUrl = coverImageUrl ?? prop.cover_image_url ?? null

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
      const { url } = await uploadFile(file, workspace.id, "property-covers", { imagesOnly: true })
      // Persist via the validated mutation so the property cache invalidates and
      // the new cover renders immediately.
      await updateProperty.mutateAsync({ id: propertyId, workspaceId: workspace.id, payload: { cover_image_url: url } })
      setCoverImageUrl(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cover upload failed"
      console.error("Cover upload failed:", err)
      setCoverError(msg)
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <>
      <OverviewTab
        prop={prop}
        unitsList={units}
        tenanciesList={tenancies}
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
        onGoTab={(tab) => router.push(`/property-manager/portfolio/properties/${propertyId}/${tab}`)}
      />
      <ImageCropModal
        file={pendingCoverFile}
        aspect={16 / 9}
        title="Crop cover image"
        onCancel={() => setPendingCoverFile(null)}
        onCropped={doCoverUpload}
      />
    </>
  )
}
