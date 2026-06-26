import { redirect } from "next/navigation"

// Canonical URL is /admin/global-translations — redirect the legacy nested route.
export default function GlobalTranslationsRedirect() {
  redirect("/admin/global-translations")
}
