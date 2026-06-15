import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/demo/status?workspaceId=… — owner/admin-only demo-data snapshot.
 * Returns counts, injected date, expiry date and edited-record count via the
 * SECURITY DEFINER demo_data_status() RPC (which enforces the owner/admin gate).
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('demo_data_status', {
    p_workspace_id: workspaceId,
  })

  if (error) {
    // 42501 → not an owner/admin of the workspace.
    const forbidden = error.code === '42501' || /not authorised/i.test(error.message)
    return NextResponse.json(
      { error: forbidden ? 'Forbidden' : 'Failed to load demo status' },
      { status: forbidden ? 403 : 500 }
    )
  }

  return NextResponse.json({ status: data })
}
