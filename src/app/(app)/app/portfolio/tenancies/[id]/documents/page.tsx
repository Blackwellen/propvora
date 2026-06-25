"use client"

import { useParams } from "next/navigation"
import { DocumentsTab } from "@/components/portfolio/tenancy-detail/DocumentsTab"

export default function TenancyDocumentsPage() {
  const params = useParams()
  return <DocumentsTab tenancyId={params.id as string} />
}
