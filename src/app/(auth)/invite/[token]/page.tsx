import type { Metadata } from "next"
import { getInviteDetails } from "@/lib/actions/invite"
import InviteClient from "./InviteClient"

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Accept your invitation to join a Propvora workspace.",
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const details = await getInviteDetails(token)

  return <InviteClient token={token} details={details} />
}
