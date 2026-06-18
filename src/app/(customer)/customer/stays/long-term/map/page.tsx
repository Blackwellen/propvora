import CustomerLongTermMapView from './MapView'
import { getPublicLongTermRentals } from '@/lib/public-marketplace/queries'

export const dynamic = 'force-dynamic'

export default async function CustomerLongTermRentalsMapPage() {
  const rentals = await getPublicLongTermRentals()
  return <CustomerLongTermMapView rentals={rentals} />
}
