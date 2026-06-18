/**
 * Long-term lets seed data — drives the Lets hub (image 16) and its tabs:
 * Viewings (18), Applications (19), Offers (20), Tenancy (21), plus the detail
 * pages (22-31). TODO(supabase): swap for RLS-scoped customer_let_* queries.
 */
import { propertyImages as IMG } from "./mock"

export interface LetProperty {
  id: string; title: string; location: string; image: string; rentPence: number
  beds: number; baths: number; furnished: boolean; available: string
}

export const recommendedLets: LetProperty[] = [
  { id: "riverside-apartment", title: "Riverside Apartment", location: "Manchester, M1", image: IMG.riverside, rentPence: 145000, beds: 2, baths: 2, furnished: true, available: "Available now" },
  { id: "city-view-flat", title: "City View Flat", location: "MediaCity, M50", image: IMG.cityLoft, rentPence: 120000, beds: 1, baths: 1, furnished: true, available: "Available 1 Jun" },
  { id: "green-quarter-house", title: "Green Quarter House", location: "Salford, M6", image: IMG.greenQuarter, rentPence: 185000, beds: 3, baths: 2, furnished: false, available: "Available now" },
  { id: "dockside-apartment", title: "Dockside Apartment", location: "Ancoats, M4", image: IMG.dockside, rentPence: 162500, beds: 2, baths: 1, furnished: true, available: "Available 7 Jun" },
]

export type ViewingStatus = "Upcoming" | "Confirmed" | "Completed" | "Reschedule requested" | "Cancelled"
export interface Viewing {
  id: string; property: string; location: string; image: string; agent: string
  date: string; time: string; status: ViewingStatus; transport: string; access: string
}
export const viewings: Viewing[] = [
  { id: "VW-2051", property: "Riverside Apartment", location: "Manchester, M1", image: IMG.riverside, agent: "James Carter", date: "24 May 2025", time: "11:00", status: "Confirmed", transport: "12 min walk", access: "Meet agent at main entrance" },
  { id: "VW-2048", property: "City View Flat", location: "MediaCity, M50", image: IMG.cityLoft, agent: "Emma Lewis", date: "26 May 2025", time: "14:30", status: "Upcoming", transport: "8 min · tram", access: "Concierge will provide access" },
  { id: "VW-2042", property: "The Edge, New Bailey", location: "Salford, M3", image: IMG.greenQuarter, agent: "Olivia Hunt", date: "28 May 2025", time: "10:00", status: "Upcoming", transport: "15 min · bus", access: "Keybox — code on confirmation" },
  { id: "VW-2031", property: "Dockside Apartment", location: "Ancoats, M4", image: IMG.dockside, agent: "Daniel Hayes", date: "18 May 2025", time: "16:00", status: "Completed", transport: "20 min walk", access: "Agent-led tour" },
  { id: "VW-2025", property: "Green Quarter House", location: "Salford, M6", image: IMG.greenQuarter, agent: "Sophie Martin", date: "20 May 2025", time: "12:00", status: "Reschedule requested", transport: "10 min · tram", access: "Meet at reception" },
]

export type ApplicationStatus = "Draft" | "Submitted" | "Under review" | "Approved" | "Declined"
export interface Application {
  id: string; property: string; location: string; image: string; rentPence: number
  status: ApplicationStatus; submitted: string; progressPct: number; score: number; affordabilityPct: number; moveIn: string
}
export const applications: Application[] = [
  { id: "AP-7841", property: "Riverside Apartment", location: "Manchester, M1", image: IMG.riverside, rentPence: 145000, status: "Under review", submitted: "20 May 2025", progressPct: 80, score: 720, affordabilityPct: 30, moveIn: "15 Jun 2025" },
  { id: "AP-7830", property: "City View Flat", location: "MediaCity, M50", image: IMG.cityLoft, rentPence: 120000, status: "Submitted", submitted: "18 May 2025", progressPct: 100, score: 740, affordabilityPct: 28, moveIn: "1 Jun 2025" },
  { id: "AP-7822", property: "Green Quarter House", location: "Salford, M6", image: IMG.greenQuarter, rentPence: 185000, status: "Draft", submitted: "—", progressPct: 45, score: 0, affordabilityPct: 38, moveIn: "1 Jul 2025" },
  { id: "AP-7810", property: "Dockside Apartment", location: "Ancoats, M4", image: IMG.dockside, rentPence: 162500, status: "Approved", submitted: "10 May 2025", progressPct: 100, score: 765, affordabilityPct: 32, moveIn: "5 Jun 2025" },
  { id: "AP-7795", property: "Harbour Side Apartment", location: "Liverpool, L3", image: IMG.harbour, rentPence: 110000, status: "Declined", submitted: "2 May 2025", progressPct: 100, score: 610, affordabilityPct: 45, moveIn: "—" },
]

export type OfferStatus = "Open" | "Counter offer" | "Accepted" | "Expired"
export interface Offer {
  id: string; property: string; location: string; image: string; rentOfferedPence: number; askingPence: number
  status: OfferStatus; moveIn: string; tenancyMonths: number; holdingDepositPence: number; furnished: boolean
}
export const offers: Offer[] = [
  { id: "OFF-250429-87", property: "Victoria Riverside", location: "Manchester, M4", image: IMG.cityLoft, rentOfferedPence: 165000, askingPence: 170000, status: "Counter offer", moveIn: "15 Jun 2025", tenancyMonths: 12, holdingDepositPence: 49500, furnished: true },
  { id: "OFF-250418-22", property: "The Edge, New Bailey", location: "Salford, M3", image: IMG.greenQuarter, rentOfferedPence: 158000, askingPence: 165000, status: "Open", moveIn: "1 Jul 2025", tenancyMonths: 12, holdingDepositPence: 47400, furnished: false },
  { id: "OFF-250402-09", property: "Dockside Apartment", location: "Ancoats, M4", image: IMG.dockside, rentOfferedPence: 162500, askingPence: 162500, status: "Accepted", moveIn: "5 Jun 2025", tenancyMonths: 24, holdingDepositPence: 48750, furnished: true },
  { id: "OFF-250322-04", property: "City View Flat", location: "MediaCity, M50", image: IMG.cityLoft, rentOfferedPence: 115000, askingPence: 120000, status: "Expired", moveIn: "—", tenancyMonths: 12, holdingDepositPence: 0, furnished: true },
]

export type TenancyStatus = "Active" | "Upcoming" | "Notice given"
export interface Tenancy {
  id: string; property: string; location: string; image: string; rentPence: number; nextPaymentDate: string
  status: TenancyStatus; moveIn: string; landlord: string; depositPence: number; termMonths: number; startDate: string
}
export const tenancies: Tenancy[] = [
  { id: "TN-55421", property: "Riverside Apartment", location: "Manchester, M1", image: IMG.riverside, rentPence: 145000, nextPaymentDate: "1 Jun 2025", status: "Active", moveIn: "1 Apr 2025", landlord: "James Thompson", depositPence: 165000, termMonths: 12, startDate: "1 Apr 2025" },
  { id: "TN-55310", property: "Dockside Apartment", location: "Ancoats, M4", image: IMG.dockside, rentPence: 162500, nextPaymentDate: "5 Jun 2025", status: "Upcoming", moveIn: "5 Jun 2025", landlord: "Olivia Hunt", depositPence: 187500, termMonths: 24, startDate: "5 Jun 2025" },
]

export function findTenancy(id: string) { return tenancies.find((t) => t.id === id) }
export function findOffer(id: string) { return offers.find((o) => o.id === id) }
export function findApplication(id: string) { return applications.find((a) => a.id === id) }
export function findViewing(id: string) { return viewings.find((v) => v.id === id) }
export function findLet(id: string) { return recommendedLets.find((l) => l.id === id) }
