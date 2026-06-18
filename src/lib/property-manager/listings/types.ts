export type ListingStatus = 'live' | 'draft' | 'needs_attention' | 'archived'

export type ListingType = 'short_stay' | 'long_term'

export type SpaceType = 'entire_home' | 'private_room' | 'shared_room'

export interface ListingChannel {
  name: 'airbnb' | 'booking_com' | 'direct' | 'vrbo' | 'rightmove'
}

export interface Listing {
  id: string
  listing_reference: string
  title: string
  subtitle?: string
  property_name: string
  property_location: string
  property_image?: string
  listing_type: ListingType
  space_type: SpaceType
  status: ListingStatus
  published: boolean
  channels: ListingChannel[]
  availability_status: string
  availability_note?: string
  price_display: string
  occupancy_mtd?: number
  adr_mtd?: number
  adr_display?: string
  direct_page_status?: 'live' | 'draft' | 'not_created'
  quality_score?: number
}
