"use client"

import { useParams } from "next/navigation"
import { UnitDocumentsTab } from "@/components/portfolio/unit-detail/UnitDocumentsTab"

export default function UnitDocumentsPage() {
  const params = useParams()
  return <UnitDocumentsTab unitId={params.id as string} />
}
