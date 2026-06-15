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
  "pdf", "jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif",
  "doc", "docx", "xls", "xlsx", "csv", "txt",
])

// ─── Magic-byte (content sniffing) validation ────────────────────────────────
//
// The client-sent content-type is attacker-controlled — a malicious file can
// claim image/png while carrying an executable or an active-content SVG. We
// sniff the leading bytes and verify the *true* type matches the declared MIME
// allowlist. This is a defence-in-depth layer on top of the extension + MIME
// checks in the upload route.

export interface SniffResult {
  /** Best-effort detected category, or null if unrecognised. */
  detected: string | null
  /** True if the bytes match one of our allowed signatures. */
  ok: boolean
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false
  }
  return true
}

/** Decode the first N bytes as latin1/ascii text for text-format sniffing. */
function asciiHead(bytes: Uint8Array, n = 1024): string {
  const len = Math.min(bytes.length, n)
  let s = ""
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[i])
  return s
}

/**
 * Sniff the real content type from magic bytes and confirm it is one of the
 * formats we permit. `declaredMime` is the (untrusted) client content-type and
 * is only used to disambiguate text formats that share no binary signature
 * (csv vs plain) — never to bypass the binary checks.
 *
 * Returns { ok:false } when the bytes don't match an allowed signature so the
 * caller can reject the upload (content/extension mismatch or disguised file).
 */
export function sniffContent(bytes: Uint8Array, declaredMime: string): SniffResult {
  const mime = (declaredMime || "").split(";")[0].trim().toLowerCase()

  // ── Binary image / document signatures ────────────────────────────────────
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return { detected: "application/pdf", ok: true } // %PDF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { detected: "image/jpeg", ok: true } // JPEG
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { detected: "image/png", ok: true } // PNG
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return { detected: "image/gif", ok: true } // GIF8
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { detected: "image/webp", ok: true }
  }
  // HEIC/HEIF: ....ftyp + heic/heif/heix/mif1/msf1 brand at offset 8
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = asciiHead(bytes.slice(8, 12))
    if (/heic|heif|heix|hevc|mif1|msf1/i.test(brand)) return { detected: "image/heic", ok: true }
  }
  // ZIP container (docx/xlsx and other OOXML) — PK\x03\x04 / PK\x05\x06 / PK\x07\x08
  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    return { detected: "application/zip", ok: true }
  }
  // Legacy MS Office (doc/xls) OLE compound file: D0 CF 11 E0 A1 B1 1A E1
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return { detected: "application/x-ole-storage", ok: true }
  }

  // ── Text formats (svg / csv / txt) — no reliable binary signature ─────────
  const head = asciiHead(bytes).trimStart()
  const looksXml = head.startsWith("<?xml") || /<svg[\s>]/i.test(head)
  if (mime === "image/svg+xml" || looksXml) {
    // SVG is text/XML; we accept it ONLY after sanitisation (active content is
    // stripped by sanitizeSvg in the route). Detect it here so plain-text
    // bombs can't masquerade as another binary type.
    if (looksXml) return { detected: "image/svg+xml", ok: true }
  }
  if (mime === "text/csv" || mime === "text/plain") {
    // Reject if the "text" actually starts with a binary/exec signature.
    if (isExecutable(bytes) || head.startsWith("<svg") || head.startsWith("<?xml")) {
      return { detected: null, ok: false }
    }
    return { detected: mime, ok: true }
  }

  return { detected: null, ok: false }
}

/** Recognise common executable / script container magic numbers (always block). */
export function isExecutable(bytes: Uint8Array): boolean {
  return (
    startsWith(bytes, [0x4d, 0x5a]) ||                   // MZ — Windows PE/EXE/DLL
    startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46]) ||       // ELF
    startsWith(bytes, [0xfe, 0xed, 0xfa]) ||             // Mach-O (32)
    startsWith(bytes, [0xcf, 0xfa, 0xed, 0xfe]) ||       // Mach-O (64 LE)
    startsWith(bytes, [0xca, 0xfe, 0xba, 0xbe]) ||       // Mach-O fat / Java class
    startsWith(bytes, [0x23, 0x21])                      // #! shebang script
  )
}

/**
 * Strip active/script content from an SVG so it can't run in a browser context
 * when later viewed. Removes <script> blocks, on* event-handler attributes,
 * javascript: URIs, <foreignObject>, and external entity declarations. Returns
 * the sanitised bytes. Conservative: when in doubt, neutralise.
 */
export function sanitizeSvg(bytes: Uint8Array): Uint8Array {
  let text = new TextDecoder("utf-8").decode(bytes)
  text = text
    // <script>…</script> (any case, across lines)
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script[\s\S]*?\/>/gi, "")
    // event handler attributes: on…="…" / on…='…' / on…=value
    .replace(/\son[a-z]+\s*=\s*"(?:[^"]*)"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'(?:[^']*)'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    // javascript: / data:text/html URIs inside href / xlink:href / src
    .replace(/(href|xlink:href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2')
    .replace(/(href|xlink:href|src)\s*=\s*("|')\s*data:text\/html[^"']*\2/gi, '$1=$2#$2')
    // foreignObject can embed arbitrary HTML
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "")
    // external entity / DOCTYPE (XXE surface)
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "")
  // Copy into a fresh ArrayBuffer-backed Uint8Array so the return type matches
  // callers that hold a Uint8Array<ArrayBuffer> (encode() yields ArrayBufferLike).
  const encoded = new TextEncoder().encode(text)
  const out = new Uint8Array(encoded.byteLength)
  out.set(encoded)
  return out
}

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

/**
 * Resolve the S3 endpoint **origin only** (scheme + host, no path).
 *
 * A common misconfiguration is setting R2_ENDPOINT to the bucket URL, e.g.
 * `https://<acct>.r2.cloudflarestorage.com/propvora`. The S3 client also
 * appends `Bucket`, producing `…/propvora/propvora/<key>` → broken uploads.
 * We strip any path so only the account origin is used. If R2_ENDPOINT is
 * unset/garbage we fall back to the account-id host (and if R2_ACCOUNT_ID was
 * mistakenly set to an API token like `cfat_…`, recover the 32-hex account id
 * from the endpoint host instead).
 */
function resolveEndpoint(accountId: string): string {
  const raw = process.env.R2_ENDPOINT?.trim()
  if (raw) {
    try {
      return new URL(raw).origin // drops any /bucket path + trailing slash
    } catch {
      /* fall through to account-id host */
    }
  }
  const looksLikeId = /^[0-9a-f]{32}$/i.test(accountId)
  if (looksLikeId) return `https://${accountId}.r2.cloudflarestorage.com`
  throw new Error("R2 endpoint cannot be resolved (set R2_ENDPOINT to the account origin)")
}

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
    endpoint: resolveEndpoint(accountId),
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
