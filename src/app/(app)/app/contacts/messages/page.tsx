/**
 * /property-manager/contacts/messages — permanent redirect
 *
 * The Contacts > Messages tab was a duplicate of the central Inbox.
 * All conversations now live under /property-manager/messages.
 *
 * Any contact_id / person_id / organisation_id query params are forwarded
 * so the Inbox can pre-filter to the relevant contact thread.
 */
import { redirect } from "next/navigation"

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ContactsMessagesRedirectPage({ searchParams }: Props) {
  const params = await searchParams
  const qs = new URLSearchParams()
  const pick = (k: string) => (Array.isArray(params[k]) ? (params[k] as string[])[0] : params[k])
  const contactId = pick("contact_id") ?? pick("person_id") ?? pick("organisation_id")
  if (contactId) qs.set("contact_id", contactId)
  redirect(`/property-manager/messages${qs.size ? `?${qs.toString()}` : ""}`)
}
