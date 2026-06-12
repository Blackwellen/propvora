import { createClient } from '@/lib/supabase/server'
import { resetDemoData } from '@/lib/demo/reset'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const resetSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required').max(100),
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
  const { workspaceId } = parseResult.data

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

  try {
    const result = await resetDemoData(workspaceId)
    return NextResponse.json({ success: true, deleted: result.deleted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[demo/reset] Reset failed:', message)
    return NextResponse.json({ error: 'Reset failed', detail: message }, { status: 500 })
  }
}
