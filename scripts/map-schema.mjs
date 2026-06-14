// Maps the entire live DB schema → docs/final-wiring/live-schema.{json,md}
// Source of truth for aligning the seeder + app data-layer to the real DB.
import { readFileSync, writeFileSync, mkdirSync } from "fs"
const env = readFileSync(".env.local", "utf8")
const get = (k) => { const m = env.match(new RegExp("^" + k + "=(.*)$", "m")); return m ? m[1].trim() : "" }
const pat = get("SUPABASE_PERSONAL_ACCESS_KEY")
const ref = get("NEXT_PUBLIC_SUPABASE_URL").match(/https:\/\/([a-z0-9]+)\./)[1]

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: "Bearer " + pat, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  })
  const j = await r.json()
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j))
  return j
}

const cols = await sql(`
  select c.table_name, c.column_name, c.ordinal_position,
         c.data_type, c.udt_name, c.is_nullable, c.column_default
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
  where c.table_schema='public'
  order by c.table_name, c.ordinal_position`)

const enums = await sql(`
  select t.typname, string_agg(e.enumlabel, '|' order by e.enumsortorder) vals
  from pg_type t join pg_enum e on e.enumtypid=t.oid
  join pg_namespace n on n.oid=t.typnamespace and n.nspname='public'
  group by t.typname order by t.typname`)

// Build structured map
const tables = {}
for (const c of cols) {
  (tables[c.table_name] ??= []).push({
    name: c.column_name,
    type: c.udt_name,
    nullable: c.is_nullable === "YES",
    default: c.column_default,
  })
}
const enumMap = {}
for (const e of enums) enumMap[e.typname] = e.vals.split("|")

mkdirSync("docs/final-wiring", { recursive: true })
writeFileSync("docs/final-wiring/live-schema.json", JSON.stringify({ tables, enums: enumMap }, null, 2))

// Markdown
let md = `# Propvora — Live DB Schema Map\n\n_Generated ${new Date().toISOString()} from the live Supabase project. Source of truth for aligning the seeder and app data layer._\n\n## Enums (${Object.keys(enumMap).length})\n\n`
for (const [name, vals] of Object.entries(enumMap)) md += `- **${name}**: \`${vals.join(", ")}\`\n`
md += `\n## Tables (${Object.keys(tables).length})\n\n`
for (const [t, c] of Object.entries(tables)) {
  md += `### ${t}\n\n| column | type | null | default |\n|---|---|---|---|\n`
  for (const col of c) {
    const isEnum = enumMap[col.type] ? ` _(enum: ${enumMap[col.type].join("/")})_` : ""
    md += `| ${col.name} | ${col.type}${isEnum} | ${col.nullable ? "Y" : "**N**"} | ${col.default ? "`" + String(col.default).slice(0, 40) + "`" : ""} |\n`
  }
  md += `\n`
}
writeFileSync("docs/final-wiring/live-schema.md", md)
console.log(`Mapped ${Object.keys(tables).length} tables, ${Object.keys(enumMap).length} enums`)
console.log("→ docs/final-wiring/live-schema.json + .md")
