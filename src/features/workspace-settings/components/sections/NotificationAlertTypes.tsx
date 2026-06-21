"use client"

import React from "react"
import { ToggleRow } from "./shared"
import {
  Bell, FileText, Wrench, AlertTriangle, DollarSign,
  Calendar, Users, Shield, MessageSquare, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface AlertToggle {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
}

const DEFAULT_ALERTS: AlertToggle[] = [
  { key: "leaseRenewals", label: "Lease renewals", description: "Upcoming lease expirations and renewal windows", icon: <FileText className="w-4 h-4" />, iconBg: "bg-blue-100 text-blue-600" },
  { key: "maintenanceRequests", label: "Maintenance requests", description: "New and updated maintenance and repair requests", icon: <Wrench className="w-4 h-4" />, iconBg: "bg-amber-100 text-amber-600" },
  { key: "incidentAlerts", label: "Incident alerts", description: "Critical incidents requiring immediate attention", icon: <AlertTriangle className="w-4 h-4" />, iconBg: "bg-red-100 text-red-600" },
  { key: "rentPayments", label: "Rent & payments", description: "Payment received, failed or overdue notifications", icon: <DollarSign className="w-4 h-4" />, iconBg: "bg-emerald-100 text-emerald-600" },
  { key: "inspectionsDue", label: "Inspections due", description: "Scheduled and overdue property inspections", icon: <Calendar className="w-4 h-4" />, iconBg: "bg-violet-100 text-violet-600" },
  { key: "tenantMessages", label: "Tenant messages", description: "New messages from tenants and landlords", icon: <MessageSquare className="w-4 h-4" />, iconBg: "bg-cyan-100 text-cyan-600" },
  { key: "teamUpdates", label: "Team updates", description: "Team member invitations and role changes", icon: <Users className="w-4 h-4" />, iconBg: "bg-indigo-100 text-indigo-600" },
  { key: "complianceAlerts", label: "Compliance alerts", description: "Compliance deadlines and certificate expirations", icon: <Shield className="w-4 h-4" />, iconBg: "bg-orange-100 text-orange-600" },
  { key: "aiInsights", label: "AI insights", description: "AI-generated recommendations and risk alerts", icon: <Zap className="w-4 h-4" />, iconBg: "bg-violet-100 text-violet-600" },
  { key: "systemAlerts", label: "System alerts", description: "Integration status and system-level notifications", icon: <Bell className="w-4 h-4" />, iconBg: "bg-slate-100 text-slate-600" },
]

export interface NotificationAlertTypesProps {
  enabled: Record<string, boolean>
  onToggle: (key: string) => void
  alerts?: AlertToggle[]
}

export function NotificationAlertTypes({
  enabled,
  onToggle,
  alerts = DEFAULT_ALERTS,
}: NotificationAlertTypesProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Alert types</h3>
      <p className="text-[12px] text-slate-400 mb-4">Choose which events trigger notifications</p>
      <div>
        {alerts.map((alert) => (
          <div key={alert.key} className="flex items-start justify-between py-3.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3 flex-1 pr-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", alert.iconBg)}>
                {alert.icon}
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-800">{alert.label}</p>
                <p className="text-[11.5px] text-slate-400 mt-0.5">{alert.description}</p>
              </div>
            </div>
            <ToggleRow
              label=""
              checked={!!enabled[alert.key]}
              onChange={() => onToggle(alert.key)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
