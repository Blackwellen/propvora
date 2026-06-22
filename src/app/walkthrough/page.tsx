import { redirect } from "next/navigation"

// The standalone walkthrough page has been folded into the Help Centre's
// "Guided walkthroughs" section. Redirect any old links there.
export default function WalkthroughPage() {
  redirect("/help")
}
