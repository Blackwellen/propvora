import { createClient } from '@/lib/supabase/server'
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

  // Demo data is seeded by the SQL function seed_demo_workspace(workspace_id,
  // user_id) — the single, schema-correct source (sets demo_data_loaded + the
  // 30-day demo_expires_at stamps itself). `variant` is accepted for API
  // compatibility but the SQL seeder loads the full coherent dataset.
  void variant
  const { error } = await supabase.rpc('seed_demo_workspace', {
    p_workspace_id: workspaceId,
    p_user_id: user.id,
  })
  if (error) {
    console.error('[demo/seed] Seed failed:', error.message)
    return NextResponse.json({ error: 'Seed failed', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
