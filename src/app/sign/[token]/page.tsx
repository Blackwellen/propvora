"use client"
import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

/* ─── Types ───────────────────────────────────────────────────── */
interface AgreementSignatory {
  id: string
  name: string
  email: string
  role: string
  signed: boolean
  signedAt?: string
  isCurrentUser: boolean
}

interface AgreementData {
  id: string
  title: string
  property: string
  parties: { landlord: string; tenant: string }
  term: string
  rent: string
  deposit: string
}

/* ─── Component ───────────────────────────────────────────────── */
export default function SigningPage() {
  const params = useParams()
  const token = (Array.isArray(params?.token) ? params.token[0] : params?.token) as string | undefined

  const [agreement, setAgreement] = useState<AgreementData | null>(null)
  const [agreementLoading, setAgreementLoading] = useState(true)
  const [agreementNotFound, setAgreementNotFound] = useState(false)
  const [agreementRowId, setAgreementRowId] = useState<string | null>(null)

  const [signatories, setSignatories] = useState<AgreementSignatory[]>([])
  const [nameInput, setNameInput] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setAgreementLoading(false); setAgreementNotFound(true); return }
    const supabase = createClient();
    (async () => {
      try {
        // Try tenancy_agreements table first
        const { data, error: dbErr } = await supabase
          .from("tenancy_agreements")
          .select("*")
          .eq("token", token)
          .single()

        if (dbErr) {
          if (dbErr.code === "42P01" || dbErr.code === "PGRST116") {
            // Table doesn't exist or row not found — try agreements table
            const { data: data2, error: dbErr2 } = await supabase
              .from("agreements")
              .select("*")
              .eq("token", token)
              .single()
            if (dbErr2 || !data2) {
              setAgreementNotFound(true)
              setAgreementLoading(false)
              return
            }
            const row = data2 as Record<string, unknown>
            setAgreementRowId(row.id as string)
            buildAgreement(row)
          } else {
            setAgreementNotFound(true)
            setAgreementLoading(false)
            return
          }
        } else if (data) {
          const row = data as Record<string, unknown>
          setAgreementRowId(row.id as string)
          buildAgreement(row)
        } else {
          setAgreementNotFound(true)
        }
      } catch {
        setAgreementNotFound(true)
      }
      setAgreementLoading(false)
    })()

    function buildAgreement(row: Record<string, unknown>) {
      const ag: AgreementData = {
        id: row.id as string,
        title: (row.title ?? row.agreement_type ?? "Tenancy Agreement") as string,
        property: (row.property_address ?? row.property ?? "") as string,
        parties: {
          landlord: (row.landlord_name ?? row.landlord ?? "") as string,
          tenant: (row.tenant_name ?? row.tenant ?? "") as string,
        },
        term: (row.term ?? row.duration ?? "") as string,
        rent: (row.rent ?? row.monthly_rent ?? "") as string,
        deposit: (row.deposit ?? row.deposit_amount ?? "") as string,
      }
      setAgreement(ag)
      // Build signatories from row data
      const sigs: AgreementSignatory[] = []
      if (ag.parties.tenant) {
        sigs.push({
          id: "tenant",
          name: ag.parties.tenant,
          email: (row.tenant_email ?? "") as string,
          role: "Tenant",
          signed: !!(row.signed_at ?? row.tenant_signed_at),
          signedAt: row.signed_at ? String(row.signed_at).slice(0, 16).replace("T", " ") : undefined,
          isCurrentUser: true,
        })
      }
      if (ag.parties.landlord) {
        sigs.push({
          id: "landlord",
          name: ag.parties.landlord,
          email: (row.landlord_email ?? "") as string,
          role: "Landlord",
          signed: !!(row.landlord_signed_at),
          signedAt: row.landlord_signed_at ? String(row.landlord_signed_at).slice(0, 16).replace("T", " ") : undefined,
          isCurrentUser: false,
        })
      }
      setSignatories(sigs)
      if (sigs.find((s) => s.isCurrentUser)?.signed) setHasSigned(true)
    }
  }, [token])

  const currentSignatory = signatories.find((s) => s.isCurrentUser)

  async function handleSign(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError("Please confirm you have read and agree to all terms."); return }
    if (!nameInput.trim()) { setError("Please type your full name to sign."); return }
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const now = new Date()
      const signedAt = now.toISOString()
      const signedAtDisplay = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}, ${now.getDate()} ${now.toLocaleString("en-GB",{ month: "short" })} ${now.getFullYear()}`
      if (agreementRowId) {
        // Try updating tenancy_agreements, fall back to agreements
        const { error: upErr } = await supabase
          .from("tenancy_agreements")
          .update({ signed_at: signedAt })
          .eq("id", agreementRowId)
        if (upErr && upErr.code === "42P01") {
          await supabase
            .from("agreements")
            .update({ signed_at: signedAt })
            .eq("id", agreementRowId)
        }
      }
      setSignatories((prev) => prev.map((s) => s.isCurrentUser ? { ...s, signed: true, signedAt: signedAtDisplay } : s))
      setHasSigned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save signature. Please try again.")
    }
    setLoading(false)
  }

  if (agreementLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading agreement…</p>
        </div>
      </div>
    )
  }

  if (agreementNotFound || !agreement) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900">Agreement not found</h2>
          <p className="text-[13px] text-slate-500 max-w-xs">
            This signing link is invalid, has expired, or the agreement no longer exists.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold text-blue-600 tracking-tight">Propvora</span>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-[13px] font-medium text-slate-700">{agreement.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-[12px] text-green-600 font-medium">Secure signing</span>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6 items-start">

          {/* ── Left panel: Agreement document ── */}
          <div className="col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-[17px] font-bold text-slate-900">{agreement.title}</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">{agreement.property}</p>
                  </div>
                </div>
              </div>

              {/* Document content — scrollable */}
              <div className="px-10 py-8 max-h-[680px] overflow-y-auto text-slate-800 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="max-w-2xl mx-auto space-y-6 font-[Georgia,serif]">

                  {/* Header */}
                  <div className="text-center pb-4 border-b border-slate-200">
                    <h2 className="text-[20px] font-bold uppercase tracking-wide text-slate-900">Assured Shorthold Tenancy Agreement</h2>
                    <p className="text-[13px] text-slate-500 mt-2">Governed by the Housing Act 1988 (as amended by the Housing Act 1996)</p>
                  </div>

                  {/* Parties */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">1. THE PARTIES</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-[13px]">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-semibold text-slate-600">LANDLORD:</span>
                        <span>{agreement.parties.landlord}</span>
                        <span className="font-semibold text-slate-600">TENANT:</span>
                        <span>{agreement.parties.tenant}</span>
                        <span className="font-semibold text-slate-600">PROPERTY:</span>
                        <span>{agreement.property}</span>
                      </div>
                    </div>
                  </section>

                  {/* Tenancy term */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">2. TENANCY TERM</h3>
                    <p className="text-[13px] leading-relaxed text-slate-700">
                      The tenancy shall commence on <strong>1 July 2026</strong> and shall continue for a fixed term of <strong>12 (twelve) calendar months</strong>, ending on <strong>30 June 2027</strong>, unless lawfully terminated earlier in accordance with the provisions of this Agreement or by operation of law.
                    </p>
                    <p className="text-[13px] leading-relaxed text-slate-700 mt-2">
                      After the fixed term, this tenancy shall become a Statutory Periodic Tenancy unless a new fixed-term agreement is entered into by both parties.
                    </p>
                  </section>

                  {/* Rent */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">3. RENT</h3>
                    <p className="text-[13px] leading-relaxed text-slate-700">
                      The Tenant shall pay to the Landlord a rent of <strong>{agreement.rent}</strong>, payable in advance on the <strong>1st day of each calendar month</strong>. The first payment shall be due on 1 July 2026.
                    </p>
                    <p className="text-[13px] leading-relaxed text-slate-700 mt-2">
                      Rent shall be paid by bank transfer to the Landlord&apos;s nominated account. The Tenant shall be responsible for ensuring that payments are received by the due date.
                    </p>
                  </section>

                  {/* Deposit */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">4. DEPOSIT</h3>
                    <p className="text-[13px] leading-relaxed text-slate-700">
                      A tenancy deposit of <strong>{agreement.deposit}</strong> shall be payable by the Tenant prior to the commencement of the tenancy. The deposit will be protected in a government-approved tenancy deposit scheme in accordance with the Housing Act 2004, and the Tenant will receive the required Prescribed Information within 30 days of receipt.
                    </p>
                  </section>

                  {/* Tenant obligations */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">5. TENANT OBLIGATIONS</h3>
                    <p className="text-[13px] text-slate-700 mb-2">The Tenant agrees to:</p>
                    <ol className="space-y-1.5 text-[13px] text-slate-700 list-none">
                      {[
                        "Pay the rent on time and in full on the due date each month.",
                        "Use the Property solely as a private residential dwelling and not for any commercial, business, or other purpose.",
                        "Keep the Property in a clean and tidy condition throughout the tenancy.",
                        "Not sublet the Property or any part of it without the prior written consent of the Landlord.",
                        "Allow the Landlord or their authorised agent access to the Property upon giving not less than 24 hours' written notice for the purpose of inspection or carrying out repairs.",
                        "Not make any alterations, additions, or improvements to the Property without the prior written consent of the Landlord.",
                        "Report any damage, defects, or disrepair to the Landlord promptly.",
                        "Comply with all statutory obligations relating to the occupation of the Property, including but not limited to anti-social behaviour legislation.",
                      ].map((clause, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-slate-400 shrink-0">5.{i + 1}</span>
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  {/* Landlord obligations */}
                  <section>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-3">6. LANDLORD OBLIGATIONS</h3>
                    <p className="text-[13px] text-slate-700 mb-2">The Landlord agrees to:</p>
                    <ol className="space-y-1.5 text-[13px] text-slate-700 list-none">
                      {[
                        "Allow the Tenant quiet enjoyment of the Property for the duration of the tenancy.",
                        "Maintain the structure and exterior of the Property in good repair.",
                        "Ensure all gas, electrical, and other installations are safe and in proper working order.",
                        "Provide a valid Energy Performance Certificate (EPC) with a rating of E or above.",
                        "Ensure working smoke alarms are fitted on each floor and a carbon monoxide alarm in any room with a solid fuel appliance.",
                        "Carry out necessary repairs within a reasonable timeframe upon notification by the Tenant.",
                      ].map((clause, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-slate-400 shrink-0">6.{i + 1}</span>
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  {/* Signatures section */}
                  <section className="border-t border-slate-200 pt-6 mt-6">
                    <h3 className="text-[14px] font-bold text-slate-900 mb-4">SIGNATURES</h3>
                    <p className="text-[12px] text-slate-500 mb-4">
                      By signing this Agreement, the parties confirm they have read, understood, and agree to be bound by all terms contained herein.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      {signatories.map((sig) => (
                        <div key={sig.id} className="border border-slate-200 rounded-lg p-4">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{sig.role}</p>
                          {sig.signed ? (
                            <div>
                              <p className="text-[15px] font-bold text-slate-900" style={{ fontFamily: "cursive" }}>{sig.name}</p>
                              <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Signed {sig.signedAt}</p>
                            </div>
                          ) : (
                            <div className="h-8 border-b border-dashed border-slate-300 flex items-end pb-1">
                              <span className="text-[11px] text-slate-400">Awaiting signature</span>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2">{sig.name}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel: Signing panel ── */}
          <div className="col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-[14px] font-semibold text-slate-900">Sign This Agreement</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">{agreement.title}</p>
              </div>

              {/* Signatories list */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Signatories</p>
                <div className="space-y-2.5">
                  {signatories.map((sig) => (
                    <div key={sig.id} className="flex items-center gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        sig.signed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {sig.signed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">{sig.name}</p>
                        <p className="text-[10px] text-slate-400">{sig.role}</p>
                      </div>
                      {sig.signed ? (
                        <span className="text-[10px] text-green-600 font-medium bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">Signed</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Awaiting</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signing form or success state */}
              <div className="px-5 py-5">
                {hasSigned ? (
                  /* ── Success state ── */
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-900">You have successfully signed this agreement</h3>
                    <p className="text-[12px] text-slate-500 mt-2">
                      A copy will be emailed to you once all parties have signed.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Signed at {signatories.find((s) => s.isCurrentUser)?.signedAt}
                    </p>
                    <button
                      onClick={() => window.close()}
                      className="mt-5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium px-6 py-2 rounded-lg transition-colors w-full"
                    >
                      Close
                    </button>
                  </div>
                ) : currentSignatory && !currentSignatory.signed ? (
                  /* ── Signing form ── */
                  <form onSubmit={handleSign} className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                        Type your full name to sign
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={currentSignatory.name}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                        style={{ fontFamily: "cursive" }}
                        required
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <span className="text-[12px] text-slate-600 leading-relaxed group-hover:text-slate-800">
                        I have read and agree to all terms of this tenancy agreement
                      </span>
                    </label>

                    {error && (
                      <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <X className="w-3.5 h-3.5 shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-[14px] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing…
                        </>
                      ) : (
                        "Sign Agreement"
                      )}
                    </button>

                    {/* Security note */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Your signature will be recorded with timestamp and IP address. This is legally binding under the{" "}
                        <span className="font-semibold">UK Electronic Communications Act 2000</span>.
                      </p>
                    </div>
                  </form>
                ) : (
                  /* ── Already signed (no current action needed) ── */
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-800">
                      You signed this agreement on {currentSignatory?.signedAt ?? "—"}
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1">
                      Awaiting other parties to sign.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Propvora branding note */}
            <p className="text-center text-[11px] text-slate-400 mt-4">
              Powered by <span className="font-semibold text-slate-500">Propvora</span> · Secure eSignature
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
