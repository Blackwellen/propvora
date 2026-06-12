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
