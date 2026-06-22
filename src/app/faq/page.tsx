import { redirect } from "next/navigation"

// The standalone FAQ has been folded into the Help Centre (categorised,
// searchable guides). Redirect any old links there.
export default function FaqPage() {
  redirect("/help")
}
