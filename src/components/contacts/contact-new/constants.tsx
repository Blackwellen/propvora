"use client"

import React from "react"
import type { ContactType } from "@/types/database"
import {
  UserCheck, Home, Wrench, Users, UserPlus, History,
  ShieldCheck, Landmark, Scale, Calculator, Shield, TrendingUp, User,
} from "lucide-react"

export const CONTACT_TYPE_OPTIONS: {
  value: ContactType
  label: string
  icon: React.ElementType
  desc: string
  colour: string
}[] = [
  { value: "tenant",         label: "Tenant",               icon: UserCheck,  desc: "Renting a property from you",             colour: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "landlord",       label: "Landlord",             icon: Home,       desc: "Property owner you manage for",            colour: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "supplier",       label: "Supplier / Contractor",icon: Wrench,     desc: "Tradesperson, contractor or vendor",       colour: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "agent",          label: "Agent",                icon: Users,      desc: "Letting or estate agent",                  colour: "border-violet-200 bg-violet-50 text-violet-700" },
  { value: "applicant",      label: "Applicant",            icon: UserPlus,   desc: "Prospective tenant or enquiry",            colour: "border-sky-200 bg-sky-50 text-sky-700" },
  { value: "post_tenant",    label: "Past Tenant",          icon: History,    desc: "Previously rented from you",               colour: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "guarantor",      label: "Guarantor",            icon: ShieldCheck,desc: "Guaranteeing a tenant's obligations",      colour: "border-purple-200 bg-purple-50 text-purple-700" },
  { value: "local_authority",label: "Local Authority",      icon: Landmark,   desc: "Council or government body",               colour: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  { value: "legal",          label: "Solicitor / Legal",    icon: Scale,      desc: "Solicitor, barrister or legal adviser",    colour: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "accountant",     label: "Accountant",           icon: Calculator, desc: "Accountant, bookkeeper or tax adviser",    colour: "border-teal-200 bg-teal-50 text-teal-700" },
  { value: "insurer",        label: "Insurer",              icon: Shield,     desc: "Insurance provider",                       colour: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  { value: "investor",       label: "Investor",             icon: TrendingUp, desc: "Property investor or backer",              colour: "border-green-200 bg-green-50 text-green-700" },
  { value: "other",          label: "Other",                icon: User,       desc: "Other contact type",                       colour: "border-slate-200 bg-slate-50 text-slate-600" },
]

export const ENQUIRY_SOURCES = [
  "Website", "Rightmove", "Zoopla", "OpenRent", "Referral",
  "Phone Enquiry", "Walk-in", "Social Media", "Other",
]

export const PREFERRED_PROPERTY_TYPES = ["Flat", "House", "HMO Room", "Studio", "Other"]
