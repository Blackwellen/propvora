import { createAdminClient } from "@/lib/supabase/admin"
import CouponCodesClient, { type CouponRow } from "./CouponCodesClient"

export const dynamic = "force-dynamic"

export default async function CouponCodesPage() {
  let rows: CouponRow[] = []

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      // 42P01 guard — table not yet migrated
      if ((error as { code?: string }).code === "42P01") {
        rows = []
      } else {
        throw error
      }
    } else {
      rows = (data ?? []) as CouponRow[]
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") {
      rows = []
    }
    // Other errors: show empty, don't crash the admin panel
  }

  return <CouponCodesClient initialRows={rows} />
}
