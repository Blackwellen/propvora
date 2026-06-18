import BookingsPage from '@/components/property-manager/bookings/BookingsPage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return <BookingsPage initialTab={tab ?? 'all'} />
}
