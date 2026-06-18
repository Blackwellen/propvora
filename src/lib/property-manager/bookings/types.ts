export type BookingStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'pending'
  | 'cancelled'
  | 'active'

export type BookingType = 'short_stay' | 'long_term'

export type PaymentStatus = 'paid' | 'unpaid' | 'monthly' | 'partial'

export interface Booking {
  id: string
  booking_reference: string
  booking_type: BookingType
  status: BookingStatus
  source_channel: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  guest_avatar?: string
  property_name: string
  property_location: string
  property_image?: string
  check_in_date: string
  check_out_date: string
  nights: number | null
  total_amount: number
  payment_status: PaymentStatus
  status_note?: string
}
