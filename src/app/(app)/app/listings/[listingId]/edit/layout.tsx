import React from "react"
import { EditWizardLoader } from "@/features/listings/wizard/components/EditWizardLoader"

export default async function EditListingWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  return <EditWizardLoader listingId={listingId}>{children}</EditWizardLoader>
}
