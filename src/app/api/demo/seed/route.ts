import { createClient } from '@/lib/supabase/server'
import { seedDemoData } from '@/lib/demo/seed'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const seedSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required').max(100),
  variant: z.string().min(1).max(50).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = seedSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues }, { status: 400 })
  }
  const { workspaceId, variant } = parseResult.data

  // Verify workspace membership (owner or admin only)
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if demo data is already loaded
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('demo_data_loaded')
    .eq('id', workspaceId)
    .single()

  if (workspace?.demo_data_loaded) {
    return NextResponse.json(
      { error: 'Demo data already loaded. Reset first before re-seeding.' },
      { status: 409 }
    )
  }

  try {
    await seedDemoData(workspaceId, user.id, variant ?? 'full')
    try {
      await supabase
        .from('workspaces')
        .update({ demo_data_loaded: true, demo_data_variant: variant ?? 'full' })
        .eq('id', workspaceId)
    } catch { /* non-fatal */ }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[demo/seed] Seed failed:', message)
    return NextResponse.json({ error: 'Seed failed', detail: message }, { status: 500 })
  }
}
