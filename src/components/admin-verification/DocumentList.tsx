import React from "react"
import { FileText, ExternalLink, FileX2 } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import type { VerificationDocumentRow } from "./data"

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—"
}

function label(type: string | null) {
  if (!type) return "Document"
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Subject's submitted KYC documents. Each row gets a short-lived signed URL
 * (minted server-side, passed in via `signedUrls`) so the reviewer opens the
 * file through an authed link — never a raw public URL. If signing failed the
 * row shows the key only.
 */
export default function DocumentList({
  documents,
  signedUrls,
}: {
  documents: VerificationDocumentRow[]
  signedUrls: Record<string, string | null>
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white py-8 text-center">
        <FileX2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">No documents submitted</p>
        <p className="text-xs text-slate-400 mt-1">The subject has not uploaded any documents yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2" role="list">
      {documents.map((d) => {
        const url = d.fileKey ? signedUrls[d.fileKey] : null
        return (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-slate-800 truncate">{label(d.type)}</p>
                {d.status && (
                  <Badge variant="outline" size="sm" className="capitalize">
                    {d.status.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {d.fileName ?? d.fileKey ?? "—"} · {fmt(d.uploadedAt)}
              </p>
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--brand)] hover:underline shrink-0"
              >
                View <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 shrink-0">Unavailable</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
