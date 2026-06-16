"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { uploadFile, validateUploadFile } from "@/lib/upload"

/** Resolve a stored R2 key (or legacy absolute URL) to a viewable URL. */
export function avatarKeyToUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith("http") || key.startsWith("/api/") || key.startsWith("data:")) return key
  return `/api/files/${key}`
}

/**
 * Profile-photo uploader. Uploads the chosen image through the server-proxied
 * /api/upload route (workspace-scoped folder `avatars`) and hands the resulting
 * R2 key back to the caller, which persists it on `profiles.avatar_url`.
 *
 * Requires a workspaceId because /api/upload authorises by workspace membership
 * and keys are prefixed `{workspaceId}/…` — the account's current workspace is
 * used so the avatar lives in storage the user already has access to.
 */
export default function AvatarUploader({
  currentKey,
  workspaceId,
  initials,
  onUploaded,
  size = 64,
}: {
  currentKey: string | null
  workspaceId: string | null
  initials: string
  onUploaded: (key: string) => void
  size?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState<string | null>(currentKey)

  const url = avatarKeyToUrl(previewKey ?? currentKey)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!workspaceId) {
      setError("No active workspace — cannot store the photo yet.")
      return
    }
    const invalid = validateUploadFile(file, { imagesOnly: true })
    if (invalid) { setError(invalid); return }
    setError(null)
    setUploading(true)
    try {
      const { key } = await uploadFile(file, workspaceId, "avatars")
      setPreviewKey(key)
      onUploaded(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-2xl bg-brand flex items-center justify-center text-white font-bold overflow-hidden"
          style={{ width: size, height: size, fontSize: size * 0.32 }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Profile photo" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 text-brand animate-spin" />
          ) : (
            <Camera className="w-3 h-3 text-slate-600" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">Profile Photo</p>
        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP or HEIC · max 10MB</p>
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          {uploading ? "Uploading…" : url ? "Replace photo" : "Upload photo"}
        </button>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      </div>
    </div>
  )
}
