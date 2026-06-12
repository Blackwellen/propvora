/**
 * Cloudflare R2 storage utilities (S3-compatible).
 *
 * Uploads are **server-proxied** (browser → our API route → R2) so we never
 * depend on R2 bucket CORS config, and downloads use short-lived presigned GET
 * URLs so objects stay private (no public bucket required).
 *
 * Env (see .env.local): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET, and optionally R2_ENDPOINT.
 */

import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// ─── Allowed file extensions ─────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "jpg", "jpeg", "png", "gif", "webp", "svg",
  "doc", "docx", "xls", "xlsx", "csv", "txt",
])

// ─── Config helpers ──────────────────────────────────────────────────────────

function r2Bucket(): string | undefined {
  return process.env.R2_BUCKET || process.env.R2_BUCKET_NAME
}

export function r2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    r2Bucket()
  )
}

// ─── R2 client factory ───────────────────────────────────────────────────────

let _client: S3Client | null = null

export function getR2Client(): S3Client {
  if (_client) return _client

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 env vars missing: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    )
  }

  _client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  return _client
}

// ─── Keys ────────────────────────────────────────────────────────────────────

/**
 * Build a storage key: {workspaceId}/{folder}/{uuid}.{ext}
 * Only extensions in ALLOWED_EXTENSIONS are accepted; throws otherwise.
 */
export function buildKey(
  workspaceId: string,
  folder: string,
  filename: string
): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File extension ".${ext}" is not allowed`)
  }
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "files"
  return `${workspaceId}/${safeFolder}/${crypto.randomUUID()}.${ext}`
}

/** A stable, app-internal URL that streams the object via our authed route. */
export function fileViewUrl(key: string): string {
  return `/api/files/${key}`
}

// ─── Server-side upload (proxy) ──────────────────────────────────────────────

/**
 * Upload bytes straight to R2 from the server. Used by /api/upload so the
 * browser never talks to R2 directly (no bucket CORS required).
 */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<void> {
  if (!r2Configured()) {
    throw new Error("R2 not configured")
  }
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: r2Bucket()!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

/**
 * Legacy: presigned PUT URL (kept for callers that still upload directly).
 * Prefer the server-proxied uploadToR2 path.
 */
export async function generateUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  if (!r2Configured()) {
    console.warn("[r2] not configured — upload URL skipped")
    return ""
  }
  const command = new PutObjectCommand({
    Bucket: r2Bucket()!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(getR2Client(), command, { expiresIn: 15 * 60 })
}

// ─── Download ────────────────────────────────────────────────────────────────

/** Presigned GET URL valid for 1 hour (objects stay private). */
export async function generateDownloadUrl(key: string, expiresIn = 60 * 60): Promise<string> {
  if (!r2Configured()) {
    console.warn("[r2] not configured — download URL skipped")
    return ""
  }
  const command = new GetObjectCommand({ Bucket: r2Bucket()!, Key: key })
  return getSignedUrl(getR2Client(), command, { expiresIn })
}

/** Fetch an object's bytes server-side (used to stream through our route). */
export async function getObjectBytes(
  key: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!r2Configured()) return null
  const res = await getR2Client().send(
    new GetObjectCommand({ Bucket: r2Bucket()!, Key: key })
  )
  if (!res.Body) return null
  const bytes = await res.Body.transformToByteArray()
  return { body: bytes, contentType: res.ContentType || "application/octet-stream" }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteObject(key: string): Promise<void> {
  if (!r2Configured()) {
    console.warn("[r2] not configured — delete skipped")
    return
  }
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: r2Bucket()!, Key: key })
  )
}
