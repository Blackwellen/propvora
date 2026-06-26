import React from "react"
import { Ticket, Tag, CheckCircle2, Clock, ShieldAlert } from "lucide-react"
import { AdminPageHeader, AdminKpiStrip, AdminNotConfigured, type AdminKpi } from "@/components/admin/ui"
import { createAdminClient } from "@/lib/supabase/admin"
import CouponCodesClient, { type CouponRow } from "./CouponCodesClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Coupon codes — Propvora admin" }

export default async function CouponCodesPage() {
  let rows: CouponRow[] = []
  let notConfigured = false

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        notConfigured = true
      } else {
        throw error
      }
    } else {
      rows = (data ?? []) as CouponRow[]
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") {
      notConfigured = true
    }
  }

  const active = rows.filter((r) => r.is_active).length
  const expired = rows.filter((r) => r.valid_until && new Date(r.valid_until) < new Date()).length
  const unlimited = rows.filter((r) => r.max_uses === null && r.is_active).length

  const kpis: AdminKpi[] = [
    { label: "Total codes", value: rows.length, icon: Tag, tone: "blue" },
    { label: "Active", value: active, icon: CheckCircle2, tone: "emerald" },
    { label: "Expired", value: expired, icon: Clock, tone: "amber" },
    { label: "Unlimited-use", value: unlimited, icon: ShieldAlert, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Ticket}
        title="Coupon codes"
        subtitle="Create, manage and deactivate platform discount codes. Codes are validated at checkout and can target specific plans, with optional usage caps and expiry dates."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Platform" }, { label: "Coupon codes" }]}
      />

      {notConfigured ? (
        <AdminNotConfigured
          title="coupon_codes table not provisioned"
          description="Apply the coupon_codes migration to enable discount code management. Codes will be validated at checkout once the table is live."
        />
      ) : (
        <>
          {rows.length > 0 && <AdminKpiStrip kpis={kpis} cols={4} />}
          <CouponCodesClient initialRows={rows} />
        </>
      )}
    </div>
  )
}
