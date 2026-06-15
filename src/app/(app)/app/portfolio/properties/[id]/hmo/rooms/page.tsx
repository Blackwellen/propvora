"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plus,
  ChevronRight,
  X,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"
import { use } from "react"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

/* ─── Types ─────────────────────────────────────────────────── */
interface RoomRow {
  id: string
  room: string
  tenant: string | null
  tenantInitials: string | null
  avatarBg: string
  rent: number | null
  rentLabel: string
  paymentDay: string
  leaseStart: string
  leaseEnd: string
  deposit: string
  scheme: string | null
  status: "occupied" | "vacant"
}

interface WizardStep {
  number: number
  label: string
}

/* ─── Sub-tab strip ─────────────────────────────────────────── */
function HmoTabStrip({ propertyId }: { propertyId: string }) {
  const pathname = usePathname()
  const base = `/app/portfolio/properties/${propertyId}/hmo`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Rooms", href: `${base}/rooms` },
    { label: "Utilities", href: `${base}/utilities` },
    { label: "Analytics", href: `${base}/analytics` },
  ]

  return (
    <div className="flex gap-1 px-4 md:px-6 border-b border-slate-200 bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const ROOMS: RoomRow[] = [
  {
    id: "r1",
    room: "Room 1",
    tenant: "Sarah Mitchell",
    tenantInitials: "SM",
    avatarBg: "bg-blue-500",
    rent: 750,
    rentLabel: "£750/mo",
    paymentDay: "1st",
    leaseStart: "1 Mar 2025",
    leaseEnd: "Periodic",
    deposit: "£750 protected",
    scheme: "DPS",
    status: "occupied",
  },
  {
    id: "r2",
    room: "Room 2",
    tenant: "James Chen",
    tenantInitials: "JC",
    avatarBg: "bg-amber-500",
    rent: 720,
    rentLabel: "£720/mo",
    paymentDay: "1st",
    leaseStart: "15 Apr 2025",
    leaseEnd: "Periodic",
    deposit: "£720 protected",
    scheme: "TDS",
    status: "occupied",
  },
  {
    id: "r3",
    room: "Room 3",
    tenant: "Emma Davies",
    tenantInitials: "ED",
    avatarBg: "bg-emerald-500",
    rent: 700,
    rentLabel: "£700/mo",
    paymentDay: "5th",
    leaseStart: "1 Jun 2025",
    leaseEnd: "Periodic",
    deposit: "£700 protected",
    scheme: "DPS",
    status: "occupied",
  },
  {
    id: "r4",
    room: "Room 4",
    tenant: "Ahmed Hassan",
    tenantInitials: "AH",
    avatarBg: "bg-violet-500",
    rent: 780,
    rentLabel: "£780/mo",
    paymentDay: "1st",
    leaseStart: "1 Jan 2025",
    leaseEnd: "Periodic",
    deposit: "£780 protected",
    scheme: "DPS",
    status: "occupied",
  },
  {
    id: "r5",
    room: "Room 5",
    tenant: "Lisa Park",
    tenantInitials: "LP",
    avatarBg: "bg-pink-500",
    rent: 900,
    rentLabel: "£900/mo",
    paymentDay: "15th",
    leaseStart: "1 Feb 2025",
    leaseEnd: "Periodic",
    deposit: "£1,350 protected",
    scheme: "mydeposits",
    status: "occupied",
  },
  {
    id: "r6",
    room: "Room 6",
    tenant: null,
    tenantInitials: null,
    avatarBg: "",
    rent: null,
    rentLabel: "£750 asking",
    paymentDay: "—",
    leaseStart: "—",
    leaseEnd: "—",
    deposit: "—",
    scheme: null,
    status: "vacant",
  },
]

const WIZARD_STEPS: WizardStep[] = [
  { number: 1, label: "Select Room" },
  { number: 2, label: "Tenant Details" },
  { number: 3, label: "Rent & Payment" },
  { number: 4, label: "Generate Agreement" },
  { number: 5, label: "Record Deposit" },
  { number: 6, label: "Right to Rent" },
  { number: 7, label: "Keys Issued" },
  { number: 8, label: "Utility Split" },
  { number: 9, label: "Portal Invite" },
  { number: 10, label: "Complete" },
]

/* ─── Wizard Modal ───────────────────────────────────────────── */
function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState("")
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "",
    rent: "",
    paymentDay: "",
    moveInDate: "",
    depositAmount: "",
    depositScheme: "",
    depositDate: "",
    docType: "",
    dateChecked: "",
    expiryDate: "",
    keyRef: "",
    keySets: "",
  })

  function handleNext() {
    if (currentStep < 10) setCurrentStep(currentStep + 1)
  }
  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const vacantRooms = ROOMS.filter((r) => r.status === "vacant")

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Wizard header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Room Onboarding Wizard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {currentStep} of 10 — {WIZARD_STEPS[currentStep - 1].label}
            </p>
          </div>
          <button aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex gap-1">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.number}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step.number <= currentStep ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {WIZARD_STEPS.map((step) => (
              <span
                key={step.number}
                className={`text-[9px] font-medium ${
                  step.number === currentStep ? "text-blue-600" : "text-slate-400"
                }`}
              >
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
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoom === room.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="room"
                      value={room.id}
                      checked={selectedRoom === room.id}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="text-blue-600"
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
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tenant@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+44 7700 000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
                  <input
                    type="number"
                    value={form.rent}
                    onChange={(e) => setForm({ ...form, rent: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="750"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Day (1-28)</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.paymentDay}
                    onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={form.moveInDate}
                    onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generate Agreement */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Generate Room Agreement</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-[10px] font-bold">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Room AST — Room 6</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assured Shorthold Tenancy Agreement · Room only · Periodic
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Generate & Preview
                    </button>
                    <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Send for eSignature
                    </button>
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
                  <input
                    type="number"
                    value={form.depositAmount}
                    onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="750"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Protection Scheme</label>
                  <select
                    value={form.depositScheme}
                    onChange={(e) => setForm({ ...form, depositScheme: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select scheme</option>
                    <option value="DPS">DPS</option>
                    <option value="TDS">TDS</option>
                    <option value="mydeposits">mydeposits</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date Protected</label>
                  <input
                    type="date"
                    value={form.depositDate}
                    onChange={(e) => setForm({ ...form, depositDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
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
                  <select
                    value={form.docType}
                    onChange={(e) => setForm({ ...form, docType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
                  <input
                    type="date"
                    value={form.dateChecked}
                    onChange={(e) => setForm({ ...form, dateChecked: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expiry Date (if time-limited)
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input type="checkbox" id="copy-taken" className="mt-0.5" />
                <label htmlFor="copy-taken" className="text-xs text-slate-700">
                  I confirm a copy of the document has been retained securely
                </label>
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
                  <input
                    type="text"
                    value={form.keyRef}
                    onChange={(e) => setForm({ ...form, keyRef: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. R6-A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Number of Sets</label>
                  <input
                    type="number"
                    min={1}
                    value={form.keySets}
                    onChange={(e) => setForm({ ...form, keySets: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input type="checkbox" id="keys-confirmed" className="mt-0.5" />
                <label htmlFor="keys-confirmed" className="text-xs text-slate-700">
                  Tenant has signed key receipt confirmation
                </label>
              </div>
            </div>
          )}

          {/* Step 8: Utility Split Update */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Utility Split Update</h3>
              <p className="text-xs text-slate-500">
                Adding Room 6 to the property will update the equal split across all occupied rooms.
              </p>
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
                      <td className="py-2 text-right text-blue-600 font-medium">16.7%</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 text-slate-700 font-medium">Room 6 (new)</td>
                    <td className="py-2 text-right text-slate-400">—</td>
                    <td className="py-2 text-right text-blue-600 font-medium">16.7%</td>
                  </tr>
                </tbody>
              </table>
              <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                Add to Equal Split
              </button>
            </div>
          )}

          {/* Step 9: Tenant Portal Invite */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Tenant Portal Invite</h3>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-xs text-slate-600">
                  A welcome email will be sent to the tenant with a link to set up their tenant portal
                  account. They can access rent statements, report maintenance, and view documents.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500">Sending to:</p>
                  <p className="text-sm font-medium text-slate-800">
                    {form.firstName || "Tenant"} {form.lastName} · {form.email || "email not entered"}
                  </p>
                </div>
                <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  Send Welcome Email with Portal Link
                </button>
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
                <p className="text-xs text-slate-500 mt-1">Room 6 tenant has been successfully onboarded.</p>
              </div>
              <div className="space-y-1.5">
                {WIZARD_STEPS.slice(0, 9).map((step) => (
                  <div
                    key={step.number}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                  >
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
              className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button aria-label="Close"
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

/* ─── Page ───────────────────────────────────────────────────── */
export default function HmoRoomsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [showWizard, setShowWizard] = useState(false)

  /* Row → card mapping for the mobile list. */
  const roomCardMapping: MobileCardMapping<RoomRow> = {
    getKey: (r) => r.id,
    title: (r) => r.room,
    subtitle: (r) => r.tenant ?? "Vacant",
    badge: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
        r.status === "occupied"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}>
        {r.status === "occupied" ? "Occupied" : "Vacant"}
      </span>
    ),
    fields: [
      { label: "Rent", render: (r) => r.rentLabel },
      { label: "Payment Day", render: (r) => r.paymentDay },
      { label: "Lease Start", render: (r) => r.leaseStart },
      { label: "Lease End", render: (r) => r.leaseEnd },
      { label: "Deposit", render: (r) => r.deposit },
      { label: "Scheme", render: (r) => r.scheme ?? "—" },
    ],
  }

  return (
    <>
      {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}

      {/* Mobile top bar */}
      <MobileTopBar
        title="Room Management"
        subtitle="22 Victoria Road, Manchester · 6 rooms"
        showBack
        backHref={`/app/portfolio/properties/${id}/hmo`}
        primaryAction={{ label: "Add room", icon: Plus, onClick: () => setShowWizard(true) }}
      />

      {/* Page Header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">Room Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">22 Victoria Road, Manchester · 6 rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            Bulk Update Rents
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Room
          </button>
        </div>
      </div>

      {/* Sub-tab strip */}
      <HmoTabStrip propertyId={id} />

      {/* Content */}
      <div className="px-4 md:px-6 pb-6 pt-5 space-y-6">
        {/* Rooms Table */}
        <div className="col-span-12">
          <ResponsiveTable rows={ROOMS} mobile={roomCardMapping}>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Room
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Tenant
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Rent
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Payment Day
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Lease Start
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Lease End
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Deposit
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ROOMS.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{room.room}</td>
                      <td className="px-4 py-3">
                        {room.tenant ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${room.avatarBg}`}
                            >
                              {room.tenantInitials}
                            </div>
                            <span className="text-sm text-slate-700">{room.tenant}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 italic">Vacant</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{room.rentLabel}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{room.paymentDay}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{room.leaseStart}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{room.leaseEnd}</td>
                      <td className="px-4 py-3">
                        {room.deposit !== "—" ? (
                          <div>
                            <p className="text-xs text-slate-700 font-medium">{room.deposit}</p>
                            {room.scheme && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                {room.scheme}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            room.status === "occupied"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {room.status === "occupied" ? "Occupied" : "Vacant"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {room.status === "occupied" ? (
                          <div className="flex items-center gap-1">
                            <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
                              View
                            </button>
                            <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowWizard(true)}
                            className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                          >
                            Create Vacancy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ResponsiveTable>
        </div>

        {/* Deposit Protection Panel */}
        <div className="col-span-12">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900">Deposit Protection Status</h3>
            </div>
            <div className="px-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    All 5 occupied rooms have deposit protection registered.
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Room 6 will require protection within 30 days of a new tenancy starting.
                    The onboarding wizard will prompt you to register at Step 5.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
