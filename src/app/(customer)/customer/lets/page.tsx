import { redirect } from "next/navigation"

export const metadata = { title: "Lets · Propvora" }

export default function CustomerLetsPage() {
  redirect("/customer/lets/search")
}
