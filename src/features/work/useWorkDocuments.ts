'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { EvidenceDoc } from '@/components/work/EvidenceUpload'

// ============================================================
// Live document reads for the Work detail pages so uploaded
// evidence survives a refresh (EvidenceUpload only seeds its
// in-session list — the persisted rows must be read back here
// and passed in as `initialDocs`).
//
// Tables (migration 20260611000006_work_ppm_plans_documents):
//   job_documents  (id, workspace_id, job_id,  name, file_url, file_type, file_size, created_at)
//   task_documents (id, workspace_id, task_id, name, file_url, file_type, file_size, created_at)
//
// Reads are 42P01-safe so a missing migration yields an honest
// empty state rather than a crash.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

interface DocRow {
  name: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
}

function toEvidenceDocs(rows: DocRow[]): EvidenceDoc[] {
  return rows
    .filter((r) => !!r.file_url)
    .map((r) => ({
      name: r.name ?? 'Document',
      url: r.file_url as string,
      type: r.file_type ?? 'application/octet-stream',
      size: r.file_size ?? 0,
    }))
}

async function fetchRecordDocuments(
  table: 'job_documents' | 'task_documents',
  fkColumn: 'job_id' | 'task_id',
  workspaceId: string,
  recordId: string
): Promise<EvidenceDoc[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .select('name, file_url, file_type, file_size, created_at')
    .eq('workspace_id', workspaceId)
    .eq(fkColumn, recordId)
    .order('created_at', { ascending: false })
  if (error) {
    if (code(error) === '42P01') return []
    throw error
  }
  return toEvidenceDocs((data ?? []) as DocRow[])
}

export function useJobDocuments(workspaceId: string | undefined, jobId: string | undefined) {
  return useQuery<EvidenceDoc[]>({
    queryKey: ['job-documents', workspaceId, jobId],
    enabled: !!workspaceId && !!jobId,
    staleTime: 30_000,
    queryFn: () => fetchRecordDocuments('job_documents', 'job_id', workspaceId!, jobId!),
  })
}

export function useTaskDocuments(workspaceId: string | undefined, taskId: string | undefined) {
  return useQuery<EvidenceDoc[]>({
    queryKey: ['task-documents', workspaceId, taskId],
    enabled: !!workspaceId && !!taskId,
    staleTime: 30_000,
    queryFn: () => fetchRecordDocuments('task_documents', 'task_id', workspaceId!, taskId!),
  })
}
