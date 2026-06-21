import { readFileSync } from "node:fs"
import { q } from "./_q.mjs"

const sql = readFileSync("supabase/seeds/20260620_marketing_capture_enrichment.sql", "utf8")
await q(sql)
console.log("Marketing capture enrichment seed applied.")
