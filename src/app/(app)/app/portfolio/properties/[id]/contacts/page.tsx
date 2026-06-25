"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts } from "@/hooks/useContacts"
import { ContactsTab } from "@/components/portfolio/property-detail/ContactsTab"

export default function PropertyContactsPage() {
  const { workspace } = useWorkspace()
  const { data: contacts = [] } = useContacts(workspace?.id)
  return <ContactsTab contacts={contacts} />
}
