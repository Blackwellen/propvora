"use client"

import { useTenancyDetailCtx } from "../layout"
import { NotesTab } from "@/components/portfolio/tenancy-detail/NotesTab"

export default function TenancyNotesPage() {
  const { t, save } = useTenancyDetailCtx()
  return <NotesTab notes={t?.notes} onSave={save} />
}
