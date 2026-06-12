import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function PropertyCoverageRedirect() {
  redirect("/app/compliance/coverage")
}
