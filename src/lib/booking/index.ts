// ============================================================================
// Booking domain barrel — P4 reservation engine + booking data model.
//
// Operator-side reads/writes are workspace-scoped via RLS on workspace_members.
// Public/anon guest checkout goes through createPublicReservation() →
// the SECURITY DEFINER `create_public_reservation` RPC, which validates
// availability and recomputes price server-side (no service-role key needed in
// the frontend). See migration 20260616080000_booking_reservations.sql.
// ============================================================================

export * from "./pricing"
export * from "./availability"
export * from "./rates"
export * from "./reservations"
