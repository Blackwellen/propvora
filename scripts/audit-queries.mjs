// Audits every supabase .from("table").select("cols") against the live schema
// and flags columns that don't exist (→ 42703 silent failures).
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

const { tables } = JSON.parse(readFileSync("docs/final-wiring/live-schema.json", "utf8"))
const colSet = {}
for (const [t, cols] of Object.entries(tables)) colSet[t] = new Set(cols.map((c) => c.name))

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) { if (!/node_modules|\.next/.test(p)) walk(p, out) }
    else if (/\.(ts|tsx)$/.test(p)) out.push(p)
  }
  return out
}

// Match .from("table") ... .select(`...`) with select close to from.
// The gap must NOT contain another .from( — otherwise a `.from(a).update()`
// followed by `.from(b).select()` would mis-pair a's table with b's columns.
const re = /\.from\(\s*["'`]([a-z_]+)["'`]\s*\)((?:(?!\.from\()[\s\S]){0,400}?)\.select\(\s*(["'`])([\s\S]*?)\3/g

const findings = []
for (const file of walk("src")) {
  const src = readFileSync(file, "utf8")
  let m
  while ((m = re.exec(src))) {
    const table = m[1]
    const sel = m[4]
    if (!colSet[table]) continue // unknown table (view / not base) — skip
    if (sel.trim() === "*" || sel.includes("(")) continue // star or relational embed
    const cols = sel.split(",").map((c) => c.trim()).filter(Boolean)
    for (const raw of cols) {
      // strip alias: "alias:real" → real ; strip "::cast" ; strip count etc.
      let col = raw.includes(":") ? raw.split(":").pop().trim() : raw
      col = col.replace(/::.*/, "").replace(/\s+.*/, "").trim()
      if (!col || col === "*" || /[(){}]/.test(col)) continue
      if (!colSet[table].has(col)) {
        const line = src.slice(0, m.index).split("\n").length
        findings.push({ file: file.replace(/\\/g, "/"), line, table, col })
      }
    }
  }
}

// Group by file
const byFile = {}
for (const f of findings) (byFile[f.file] ??= []).push(f)
console.log(`\n=== ${findings.length} misaligned column refs in ${Object.keys(byFile).length} files ===\n`)
for (const [file, fs] of Object.entries(byFile)) {
  console.log(file)
  for (const f of fs) console.log(`  L${f.line}  ${f.table}.${f.col}`)
}
