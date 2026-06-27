"use client"

import React, { useState } from "react"
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"

interface WizardStep {
  number: number
  label: string
}

const WIZARD_STEPS: WizardStep[] = [
  { number: 1,  label: "Select Room" },
  { number: 2,  label: "Tenant Details" },
  { number: 3,  label: "Rent & Payment" },
  { number: 4,  label: "Generate Agreement" },
  { number: 5,  label: "Record Deposit" },
  { number: 6,  label: "Right to Rent" },
  { number: 7,  label: "Keys Issued" },
  { number: 8,  label: "Utility Split" },
  { number: 9,  label: "Portal Invite" },
  { number: 10, label: "Complete" },
]

interface VacantRoom {
  id: string
  room: string
  rentLabel: string
}

interface OnboardingWizardProps {
  vacantRooms: VacantRoom[]
  onClose: () => void
}

interface WizardForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  rent: string
  paymentDay: string
  moveInDate: string
  depositAmount: string
  depositScheme: string
  depositDate: string
  docType: string
  dateChecked: string
  expiryDate: string
  keyRef: string
  keySets: string
}

const DEFAULT_FORM: WizardForm = {
  firstName: "", lastName: "", email: "", phone: "", source: "",
  rent: "", paymentDay: "", moveInDate: "",
  depositAmount: "", depositScheme: "", depositDate: "",
  docType: "", dateChecked: "", expiryDate: "",
  keyRef: "", keySets: "",
}

export function OnboardingWizard({ vacantRooms, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState("")
  const [form, setForm] = useState<WizardForm>(DEFAULT_FORM)

  function handleNext() {
    if (currentStep < 10) setCurrentStep(currentStep + 1)
  }
  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }
  function setField(field: keyof WizardForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Room Onboarding Wizard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {currentStep} of 10 — {WIZARD_STEPS[currentStep - 1].label}
            </p>
          </div>
          <button aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex gap-1">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.number}
                className={`h-1.5 flex-1 rounded-full transition-colors ${step.number <= currentStep ? "bg-[var(--brand)]" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {WIZARD_STEPS.map((step) => (
              <span key={step.number} className={`text-[9px] font-medium ${step.number === currentStep ? "text-[var(--brand)]" : "text-slate-400"}`}>
                {step.number}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Select Room */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Select a Vacant Room</h3>
              <div className="space-y-2">
                {vacantRooms.map((room) => (
                  <label
                    key={room.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedRoom === room.id ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="room"
                      value={room.id}
                      checked={selectedRoom === room.id}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="text-[var(--brand)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{room.room}</p>
                      <p className="text-xs text-slate-500">{room.rentLabel} asking</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tenant Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Tenant Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Last name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="tenant@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="+44 7700 000000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setField("source", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                    <option value="">Select source</option>
                    <option value="direct">Direct enquiry</option>
                    <option value="rightmove">Rightmove</option>
                    <option value="zoopla">Zoopla</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rent & Payment */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Rent & Payment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Rent (£)</label>
                  <input type="number" value={form.rent} onChange={(e) => setField("rent", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="750" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Day (1-28)</label>
                  <input type="number" min={1} max={28} value={form.paymentDay} onChange={(e) => setField("paymentDay", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="1" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Move-in Date</label>
                  <input type="date" value={form.moveInDate} onChange={(e) => setField("moveInDate", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generate Agreement */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Generate Room Agreement</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-12 bg-[var(--color-brand-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--brand)] text-[10px] font-bold">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Room AST — {selectedRoom || "Selected Room"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Assured Shorthold Tenancy Agreement · Room only · Periodic</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Generate & Preview</button>
                    <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Send for eSignature</button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                Agreement will be pre-filled with tenant details from Step 2.
              </div>
            </div>
          )}

          {/* Step 5: Record Deposit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Record Deposit</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deposit Amount (£)</label>
                  <input type="number" value={form.depositAmount} onChange={(e) => setField("depositAmount", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="750" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Protection Scheme</label>
                  <select value={form.depositScheme} onChange={(e) => setField("depositScheme", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                    <option value="">Select scheme</option>
                    <option value="DPS">DPS</option>
                    <option value="TDS">TDS</option>
                    <option value="mydeposits">mydeposits</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date Protected</label>
                  <input type="date" value={form.depositDate} onChange={(e) => setField("depositDate", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>
              <div className="bg-[var(--brand-soft)] border border-[var(--color-brand-100)] rounded-lg px-3 py-2.5 text-xs text-[var(--brand)]">
                Deposit must be protected within 30 days of receipt. Prescribed Information must be served.
              </div>
            </div>
          )}

          {/* Step 6: Right to Rent */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Right to Rent Check</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Document Type Seen</label>
                  <select value={form.docType} onChange={(e) => setField("docType", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                    <option value="">Select document</option>
                    <option value="passport_uk">UK/EEA Passport</option>
                    <option value="brp">Biometric Residence Permit</option>
                    <option value="visa">Visa/Entry clearance</option>
                    <option value="share_code">Home Office Share Code</option>
                    <option value="birth_cert">Birth Certificate + NI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date Checked</label>
                  <input type="date" value={form.dateChecked} onChange={(e) => setField("dateChecked", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date (if time-limited)</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input type="checkbox" id="copy-taken" className="mt-0.5" />
                <label htmlFor="copy-taken" className="text-xs text-slate-700">I confirm a copy of the document has been retained securely</label>
              </div>
            </div>
          )}

          {/* Step 7: Keys Issued */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Keys Issued</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Key Reference</label>
                  <input type="text" value={form.keyRef} onChange={(e) => setField("keyRef", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="e.g. R6-A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Number of Sets</label>
                  <input type="number" min={1} value={form.keySets} onChange={(e) => setField("keySets", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="2" />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input type="checkbox" id="keys-confirmed" className="mt-0.5" />
                <label htmlFor="keys-confirmed" className="text-xs text-slate-700">Tenant has signed key receipt confirmation</label>
              </div>
            </div>
          )}

          {/* Step 8: Utility Split Update */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Utility Split Update</h3>
              <p className="text-xs text-slate-500">Adding the new room will update the equal split across all occupied rooms.</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-500 font-medium">Room</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Current Share</th>
                    <th className="text-right py-2 text-slate-500 font-medium">New Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5"].map((r) => (
                    <tr key={r}>
                      <td className="py-2 text-slate-700">{r}</td>
                      <td className="py-2 text-right text-slate-700">20%</td>
                      <td className="py-2 text-right text-[var(--brand)] font-medium">16.7%</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 text-slate-700 font-medium">New Room</td>
                    <td className="py-2 text-right text-slate-400">—</td>
                    <td className="py-2 text-right text-[var(--brand)] font-medium">16.7%</td>
                  </tr>
                </tbody>
              </table>
              <button className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Add to Equal Split</button>
            </div>
          )}

          {/* Step 9: Tenant Portal Invite */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Tenant Portal Invite</h3>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-xs text-slate-600">A welcome email will be sent to the tenant with a link to set up their tenant portal account.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500">Sending to:</p>
                  <p className="text-sm font-medium text-slate-800">
                    {form.firstName || "Tenant"} {form.lastName} · {form.email || "email not entered"}
                  </p>
                </div>
                <button className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Send Welcome Email with Portal Link</button>
              </div>
            </div>
          )}

          {/* Step 10: Complete */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Onboarding Complete!</h3>
                <p className="text-xs text-slate-500 mt-1">Tenant has been successfully onboarded.</p>
              </div>
              <div className="space-y-1.5">
                {WIZARD_STEPS.slice(0, 9).map((step) => (
                  <div key={step.number} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-800 font-medium">{step.label} — Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {currentStep < 10 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              aria-label="Close"
              onClick={onClose}
              className="bg-green-600 text-white hover:bg-green-700 text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
