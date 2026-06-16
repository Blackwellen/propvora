import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const resetSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required').max(100),
  /** When true, demo records the user has since edited are kept. */
  preserveEdited: z.boolean().optional(),
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

  const parseResult = resetSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues }, { status: 400 })
  }
  const { workspaceId, preserveEdited } = parseResult.data
  void preserveEdited

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

  // Removal is handled by the consolidated SQL function reset_demo_data(
  // workspace_id) — the matching teardown for seed_full_demo_workspace. It
  // removes EXACTLY the demo rows this workspace was seeded with (operator
  // substrate + deep finance/ledger/automations/documents, or supplier/customer
  // rows) in FK-safe order and clears demo_data_loaded.
  const { error } = await supabase.rpc('reset_demo_data', {
    p_workspace_id: workspaceId,
  })
  if (error) {
    console.error('[demo/reset] Reset failed:', error.message)
    return NextResponse.json({ error: 'Reset failed', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
