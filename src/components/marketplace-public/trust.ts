import type { TrustKind } from "@/components/marketplace/TrustBadge"
import type { PublicListing } from "@/lib/marketplace/search"

/* Derive trust badges ONLY from real verification fields the data layer
   provides — the UI never fabricates a credential. */
export function trustFromListing(l: Pick<PublicListing, "verificationStatus" | "rating" | "reviewCount" | "instantBook">): TrustKind[] {
  const out: TrustKind[] = []
  if (l.verificationStatus === "verified" || l.verificationStatus === "approved") out.push("verified")
  if (l.instantBook) out.push("responsive")
  if ((l.rating ?? 0) >= 4.7 && (l.reviewCount ?? 0) >= 5) out.push("top_rated")
  return out
}
