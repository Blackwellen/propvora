import "server-only"
import React from "react"
import { getStatusSummary } from "@/lib/supplier-verification"
import VerificationCentre from "./VerificationCentre"

/**
 * Server wrapper that loads the supplier's verification summary and renders the
 * client centre. The supplier-workspace pages (another wave) embed this with the
 * supplier's workspace id; it self-contains data loading + the step UI.
 *
 * Membership is enforced by the API routes the client calls; this server read
 * uses the service-role summary builder behind those gated routes' parent pages.
 */
export default async function VerificationCentrePanel({
  supplierWorkspaceId,
}: {
  supplierWorkspaceId: string
}) {
  const summary = await getStatusSummary(supplierWorkspaceId)
  return (
    <VerificationCentre supplierWorkspaceId={supplierWorkspaceId} initialSummary={summary} />
  )
}
