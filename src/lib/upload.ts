/**
 * Client helper: upload a file through the server-proxied /api/upload route.
 * Returns the R2 key and an app-internal authed view URL (`/api/files/{key}`).
 */
export interface UploadedFile {
  key: string
  url: string
  name: string
  type: string
  size: number
}

export async function uploadFile(
  file: File,
  workspaceId: string,
  folder: string
): Promise<UploadedFile> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("workspaceId", workspaceId)
  fd.append("folder", folder)

  const res = await fetch("/api/upload", { method: "POST", body: fd })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    throw new Error(json.error || `Upload failed (${res.status})`)
  }
  return json as UploadedFile
}
