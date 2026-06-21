import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stays/[id]/availability
 *
 * Returns an array of ISO date strings that are fully blocked
 * (due to confirmed / active bookings) for a given stay id.
 *
 * 42P01-safe: if the bookings table doesn't exist yet, returns { blockedDates: [] }
 * so the calendar renders with no blocked dates rather than crashing.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    // Query confirmed / active bookings for this stay
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', id)
      .in('status', ['confirmed', 'active', 'checked_in'])

    if (error) {
      // 42P01 = table does not exist — silently return empty
      if (
        error.code === '42P01' ||
        String(error.message).includes('does not exist') ||
        String(error.code).includes('PGRST116')
      ) {
        return NextResponse.json({ blockedDates: [] })
      }
      console.warn('[stays/availability] DB error:', error.message)
      return NextResponse.json({ blockedDates: [] })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ blockedDates: [] })
    }

    // Expand each booking range into individual ISO date strings
    const blockedSet = new Set<string>()

    for (const row of data) {
      if (!row.check_in || !row.check_out) continue
      const start = new Date(row.check_in)
      const end = new Date(row.check_out)
      const cur = new Date(start)
      while (cur < end) {
        const iso = cur.toISOString().slice(0, 10)
        blockedSet.add(iso)
        cur.setDate(cur.getDate() + 1)
      }
    }

    return NextResponse.json(
      { blockedDates: Array.from(blockedSet).sort() },
      {
        headers: {
          // Cache for 60s on the CDN edge — stale bookings are fine short-term
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (err) {
    console.warn('[stays/availability] unexpected error:', err)
    return NextResponse.json({ blockedDates: [] })
  }
}
