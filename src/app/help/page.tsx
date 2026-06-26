import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { createClient } from "@/lib/supabase/server"
import HelpCenterClient from "./HelpCenterClient"
import { STATIC_HELP_ARTICLES, type HelpArticle } from "./help-data"

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Propvora Help Centre — getting-started guides and answers for running your property operations, compliance and money.",
  openGraph: {
    title: "Help Centre | Propvora",
    description:
      "Getting-started guides and answers for running your property operations on Propvora.",
    type: "website",
  },
}

// Public help content can change without a redeploy when backed by a table.
export const revalidate = 300

interface HelpArticleRow {
  id?: string | number
  slug?: string | null
  category?: string | null
  title?: string | null
  summary?: string | null
  excerpt?: string | null
  body?: string | null
  content?: string | null
  sections?: Array<{ heading: string; body: string }> | null
  flag?: string | null
  read_mins?: number | null
}

async function loadArticles(): Promise<{ articles: HelpArticle[]; source: "live" | "static" }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("help_articles")
      .select("id, slug, category, title, summary, excerpt, body, content, sections, flag, read_mins")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("sort_order", { ascending: true })

    // 42P01 = table does not exist → fall back to static content.
    if (error || !data || data.length === 0) {
      return { articles: STATIC_HELP_ARTICLES, source: "static" }
    }

    const mapped: HelpArticle[] = (data as HelpArticleRow[]).map((row, i) => ({
      id: String(row.id ?? row.slug ?? i),
      slug: row.slug ?? String(row.id ?? i),
      category: row.category ?? "General",
      title: row.title ?? "Untitled",
      summary: row.summary ?? row.excerpt ?? "",
      flag: (row.flag as HelpArticle["flag"]) ?? undefined,
      readMins: row.read_mins ?? undefined,
      sections: Array.isArray(row.sections) && row.sections.length > 0
        ? row.sections
        : [{ heading: "Overview", body: row.body ?? row.content ?? row.summary ?? "" }],
    }))

    return { articles: mapped, source: "live" }
  } catch {
    return { articles: STATIC_HELP_ARTICLES, source: "static" }
  }
}

export default async function HelpPage() {
  const { articles, source } = await loadArticles()

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <HelpCenterClient articles={articles} source={source} />
      <PublicFooter />
    </div>
  )
}
