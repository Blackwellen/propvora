import type { Metadata } from "next"
import ContactClient from "./ContactClient"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Contact Us | Propvora",
  description: "Get in touch with Propvora. Book a demo or ask us anything.",
  openGraph: {
    title: "Contact Us | Propvora",
    description: "Get in touch with Propvora. Book a demo or ask us anything.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Propvora",
    description: "Get in touch with Propvora. Book a demo or ask us anything.",
  },
}

export default function ContactPage() {
  return (
    <>
      <ContactClient />
      <PublicFooter />
    </>
  )
}
