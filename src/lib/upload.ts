/**
 * Client helper: upload a file through the server-proxied /api/upload route.
 *
 * Persistence contract: the server stores the bytes in R2 under a stable `key`
 * and returns BOTH the key and an app-internal authed view URL
 * (`/api/files/{key}`). Callers MUST persist the `key` (and/or `url`) on their
 * record — never a transient blob:/object URL — so previews resolve correctly
 * after a website OR PWA refresh.
 */
export interface UploadedFile {
  key: string
  url: string
  name: string
  type: string
  size: number
  /** Quarantine status set server-side at upload time ('pending' until scanned). */
  scanStatus?: string
}

/** Client-side validation mirror of the server allowlist (fast-fail UX). */
export const MAX_UPLOAD_BYTES = 10_485_760 // 10 MB — must match /api/upload

// ── UPLOAD-016: Blocked executable / script extensions ────────────────────────
//
// Defence-in-depth: reject dangerous extensions at the client validation layer
// (fast-fail UX) so they never reach the server. The server independently
// rejects them via the ALLOWED_EXTENSIONS allowlist in src/lib/r2.ts and the
// isExecutable() magic-byte check in /api/upload/route.ts.

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".sh", ".bat", ".cmd", ".ps1", ".vbs",
  ".js", ".mjs", ".ts", ".py", ".rb", ".php",
])

const BLOCKED_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-sh",
  "application/x-bat",
  "text/x-script",
])

/**
 * Returns true when the filename ends with a blocked executable/script extension.
 * Case-insensitive. Used as a fast-fail guard BEFORE attempting upload.
 */
export function hasBlockedExtension(filename: string): boolean {
  const lastDot = filename.lastIndexOf(".")
  if (lastDot === -1) return false
  const ext = filename.slice(lastDot).toLowerCase()
  return BLOCKED_EXTENSIONS.has(ext)
}

/**
 * Returns true when the MIME type is in the blocked list.
 * Strips charset suffixes before comparison.
 */
export function hasBlockedMimeType(mimeType: string): boolean {
  const base = mimeType.split(";")[0].trim().toLowerCase()
  return BLOCKED_MIME_TYPES.has(base)
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]

/**
 * Pre-flight validation before hitting the network. Returns an error string
 * when the file should be rejected, or null when it's acceptable. `imagesOnly`
 * restricts to the image allowlist (avatar / cover / gallery uploaders).
 */
export function validateUploadFile(
  file: File,
  opts: { imagesOnly?: boolean } = {}
): string | null {
  if (file.size <= 0) return "That file is empty."
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`
  }

  // UPLOAD-016: Block executable/script extensions before any network call.
  if (hasBlockedExtension(file.name)) {
    return "That file type is not allowed for security reasons."
  }

  const type = (file.type || "").split(";")[0].trim().toLowerCase()

  // UPLOAD-016: Block known executable MIME types.
  if (type && hasBlockedMimeType(type)) {
    return "That file type is not allowed for security reasons."
  }

  const allowed = opts.imagesOnly
    ? ACCEPTED_IMAGE_TYPES
    : [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES]
  // Some mobile camera captures arrive with an empty type — allow and let the
  // server's magic-byte sniffing be the source of truth in that case.
  if (type && !allowed.includes(type)) {
    return opts.imagesOnly
      ? "Please choose an image (JPG, PNG, WebP, GIF or HEIC)."
      : `That file type isn't supported.`
  }
  return null
}

/**
 * Upload via the server proxy. Reports progress through `onProgress` (0–100)
 * using XHR (fetch has no upload-progress events). Resolves with the persisted
 * reference { key, url, … }.
 */
export async function uploadFile(
  file: File,
  workspaceId: string,
  folder: string,
  opts: { onProgress?: (pct: number) => void; signal?: AbortSignal; imagesOnly?: boolean } = {}
): Promise<UploadedFile> {
  // Pre-flight validation — fail fast with a friendly message BEFORE the network
  // call, so a bad/empty/oversized/wrong-type file never round-trips to a 400.
  // Every caller gets this for free; image uploaders pass `imagesOnly: true`.
  const invalid = validateUploadFile(file, { imagesOnly: opts.imagesOnly })
  if (invalid) return Promise.reject(new Error(invalid))

  const fd = new FormData()
  fd.append("file", file)
  fd.append("workspaceId", workspaceId)
  fd.append("folder", folder)

  // Use XHR so we can surface upload progress (PWA/mobile UX).
  return new Promise<UploadedFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")

    if (opts.onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          opts.onProgress!(Math.round((e.loaded / e.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      let json: Record<string, unknown> = {}
      try {
        json = JSON.parse(xhr.responseText)
      } catch {
        /* non-JSON error */
      }
      if (xhr.status >= 200 && xhr.status < 300 && !json.error) {
        resolve(json as unknown as UploadedFile)
      } else {
        reject(new Error((json.error as string) || `Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.onabort = () => reject(new Error("Upload cancelled"))

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(fd)
  })
}
