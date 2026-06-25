// Feature flag for the external portal surface. Default OFF so the
// magic-link surface cannot be reached in production until explicitly
// enabled. Reads a NEXT_PUBLIC_ var so the same answer is available on the
// server (route handlers / server components) and client (links).
//
// Enabled ONLY when the value is exactly "true" (string). Anything else —
// unset, "false", "0", "off" — is treated as disabled (fail closed).
export function isExternalPortalEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED === "true"
}

// Feature flag for the EXTENDED portal profiles (applicant / accountant /
// solicitor / generic). Default OFF: V1 ships only the three profiles that have
// a real, dedicated recipient experience (landlord / supplier / tenant). The
// extended profiles have no dedicated portal — granting one routes the recipient
// into the supplier view — so they are hidden until intentionally enabled.
//
// Honoured on both server and client (NEXT_PUBLIC_). The global QA bypass
// (NEXT_PUBLIC_QA_ALL_FLAGS) reveals them for QA testing.
export function isExtendedPortalProfilesEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return true
  return process.env.NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED === "true"
}
