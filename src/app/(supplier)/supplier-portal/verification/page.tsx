"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { resolveSupplierContext, type SupplierContext } from "../_lib/supplier-context"

// ── Types ─────────────────────────────────────────────────────────────────────

type DocCategory = "id" | "insurance" | "licence"

interface DocCategoryMeta {
  key: DocCategory
  label: string
  description: string
  accept: string
  docType: string
}

const CATEGORIES: DocCategoryMeta[] = [
  {
    key: "id",
    label: "Identity Document",
    description: "Passport, driving licence, or national ID card",
    accept: "image/jpeg,image/png,image/webp,application/pdf",
    docType: "passport",
  },
  {
    key: "insurance",
    label: "Insurance Certificate",
    description: "Public liability, employers' liability, or professional indemnity",
    accept: "application/pdf,image/jpeg,image/png",
    docType: "insurance",
  },
  {
    key: "licence",
    label: "Trade Licence / Accreditation",
    description: "Gas Safe, NICEIC, NAPIT, or other regulated trade certificate",
    accept: "application/pdf,image/jpeg,image/png",
    docType: "licence",
  },
]

type UploadStatus = "idle" | "uploading" | "done" | "error"

interface UploadState {
  status: UploadStatus
  error: string | null
}

interface VerificationDoc {
  id: string
  doc_type: string
  name: string
  is_verified: boolean
  expiry_date: string | null
  created_at: string
  /** Derived from notes field: "status:rejected" | "status:in_review" etc. */
  notes: string | null
}

/** Derive review status from is_verified + notes (status stored there since
 *  supplier_documents has no dedicated status column). */
function deriveStatus(doc: VerificationDoc): "approved" | "rejected" | "in_review" | "pending" {
  if (doc.is_verified) return "approved"
  const notes = doc.notes ?? ""
  if (notes.includes("status:rejected")) return "rejected"
  if (notes.includes("status:in_review")) return "in_review"
  return "pending"
}

function statusBadge(doc: VerificationDoc) {
  const s = deriveStatus(doc)
  if (s === "approved") return <Badge variant="success" dot>Approved</Badge>
  if (s === "rejected") return <Badge variant="danger" dot>Rejected</Badge>
  if (s === "in_review") return <Badge variant="warning" dot>Under review</Badge>
  return <Badge variant="default" dot>Pending review</Badge>
}

function StatusIcon({ doc }: { doc: VerificationDoc }) {
  const s = deriveStatus(doc)
  if (s === "approved") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  if (s === "rejected") return <XCircle className="w-4 h-4 text-red-500" />
  return <Clock className="w-4 h-4 text-amber-500" />
}

function fmtDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ── Upload card per category ──────────────────────────────────────────────────

function UploadCard({
  meta,
  existingDocs,
  workspaceId,
  contactId,
  onUploaded,
}: {
  meta: DocCategoryMeta
  existingDocs: VerificationDoc[]
  workspaceId: string
  contactId: string
  onUploaded: () => void
}) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", error: null })
  const fileRef = useRef<HTMLInputElement>(null)

  const categoryDocs = existingDocs.filter((d) => {
    if (meta.key === "id") return ["passport", "driving_licence", "national_id", "proof_of_address", "other"].includes(d.doc_type)
    if (meta.key === "insurance") return d.doc_type === "insurance"
    if (meta.key === "licence") return d.doc_type === "licence"
    return false
  })

  async function handleFile(file: File) {
    if (!file) return
    setUploadState({ status: "uploading", error: null })

    try {
      // Step 1: upload file to R2 via /api/upload
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      form.append("folder", "supplier-verification")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok) {
        setUploadState({ status: "error", error: uploadJson.error ?? "Upload failed" })
        return
      }

      // Step 2: create supplier_documents row with status 'pending_review'
      const supabase = createClient()
      const docType =
        meta.key === "id" ? "other" :
        meta.key === "insurance" ? "insurance" :
        "licence"

      const { error: insertErr } = await supabase
        .from("supplier_documents")
        .insert({
          workspace_id: workspaceId,
          supplier_id: contactId,
          doc_type: docType,
          name: file.name,
          // r2 key + pending status encoded in notes (table has no status column)
          notes: `r2_key:${uploadJson.key}|status:pending_review`,
          is_verified: false,
        })

      if (insertErr) {
        setUploadState({ status: "error", error: insertErr.message })
        return
      }

      setUploadState({ status: "done", error: null })
      onUploaded()
    } catch (err) {
      setUploadState({
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      })
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          {meta.label}
        </CardTitle>
        <p className="text-xs text-slate-400">{meta.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing docs for this category */}
        {categoryDocs.length > 0 && (
          <div className="space-y-2">
            {categoryDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <StatusIcon doc={doc} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{doc.name}</p>
                  {doc.expiry_date && (
                    <p className="text-[11px] text-slate-400">Expires {fmtDate(doc.expiry_date)}</p>
                  )}
                </div>
                {statusBadge(doc)}
              </div>
            ))}
          </div>
        )}

        {/* Upload control */}
        <input
          ref={fileRef}
          type="file"
          accept={meta.accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            // reset so same file can re-trigger
            e.target.value = ""
          }}
        />

        {uploadState.status === "uploading" ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            <span className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin shrink-0" />
            Uploading…
          </div>
        ) : uploadState.status === "done" ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Uploaded — pending review
          </div>
        ) : (
          <>
            {uploadState.error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {uploadState.error}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadState({ status: "idle", error: null })
                fileRef.current?.click()
              }}
            >
              <UploadCloud className="w-4 h-4" />
              {categoryDocs.length > 0 ? "Upload updated document" : "Upload document"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupplierVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<SupplierContext | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [docs, setDocs] = useState<VerificationDoc[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supplier = await resolveSupplierContext()
        if (!supplier || !supplier.workspaceId) {
          setNoContext(true)
          return
        }
        setCtx(supplier)

        const supabase = createClient()
        const { data, error } = await supabase
          .from("supplier_documents")
          .select("id, doc_type, name, is_verified, expiry_date, created_at, notes")
          .eq("supplier_id", supplier.contactId)
          .eq("workspace_id", supplier.workspaceId)
          .order("created_at", { ascending: false })

        if (error && (error as { code?: string }).code !== "42P01") {
          setLoadError("Could not load your documents.")
        } else {
          setDocs((data ?? []) as VerificationDoc[])
        }
      } catch {
        setLoadError("Could not load verification data.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No supplier account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Verification requires a linked supplier workspace. Contact your operator to grant portal access.
        </p>
      </div>
    )
  }

  const workspaceId = ctx!.workspaceId!
  const contactId = ctx!.contactId

  const approvedCount = docs.filter((d) => deriveStatus(d) === "approved").length
  const pendingCount = docs.filter((d) => ["pending", "in_review"].includes(deriveStatus(d))).length
  const rejectedCount = docs.filter((d) => deriveStatus(d) === "rejected").length

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          Verification Documents
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload your identity, insurance, and trade licence documents for review.
          All documents are reviewed manually by our team before approval.
        </p>
      </div>

      {loadError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Status summary */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 rounded-2xl border-slate-200 text-center">
            <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Approved</p>
          </Card>
          <Card className="p-3 rounded-2xl border-slate-200 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pending review</p>
          </Card>
          <Card className="p-3 rounded-2xl border-slate-200 text-center">
            <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Rejected</p>
          </Card>
        </div>
      )}

      {/* Honesty note */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          Uploaded documents are reviewed manually by our team. Approval means only that we have
          reviewed the evidence you provided — it is not a government check or guarantee.
          Documents are stored securely and are not shared with third parties without your consent.
        </p>
      </div>

      {/* Upload cards per category */}
      {CATEGORIES.map((cat) => (
        <UploadCard
          key={cat.key}
          meta={cat}
          existingDocs={docs}
          workspaceId={workspaceId}
          contactId={contactId}
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
      ))}
    </div>
  )
}
