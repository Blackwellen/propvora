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
}

async function loadArticles(): Promise<{ articles: HelpArticle[]; source: "live" | "static" }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("help_articles")
      .select("id, slug, category, title, summary, excerpt, body, content")
      .order("category", { ascending: true })

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
      body: row.body ?? row.content ?? row.summary ?? "",
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
