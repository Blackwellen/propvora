import { Sparkles } from "lucide-react"
import { adminListChangelog } from "@/lib/comms/data"
import ChangelogEditor from "./ChangelogEditor"

export const dynamic = "force-dynamic"

export default async function AdminChangelogPage() {
  const entries = await adminListChangelog(200)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            Changelog
          </h1>
          <p className="text-sm text-slate-500">
            Author and publish product release notes. Published entries appear on the public{" "}
            <a href="/changelog" className="text-[#2563EB] hover:underline" target="_blank" rel="noopener noreferrer">
              /changelog
            </a>{" "}
            page.
          </p>
        </div>
      </div>

      <ChangelogEditor initialEntries={entries} />
    </div>
  )
}
