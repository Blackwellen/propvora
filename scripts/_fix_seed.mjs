import { readFileSync, writeFileSync } from "fs"
const f = "src/lib/demo/seed.ts"
let s = readFileSync(f, "utf8")
function scoped(start, end, fn) {
  const i = s.indexOf(start); const j = s.indexOf(end, i)
  if (i < 0 || j < 0) { console.log("MISS", start); return }
  s = s.slice(0, i) + fn(s.slice(i, j)) + s.slice(j)
}
const tpl = {
  "42 Sycamore Road": "hmo", "88 Hawthorn Street": "r2r", "22 Birchfield Lane": "hmo",
  "7 Redwood Avenue": "sa_lite", "15 Chestnut Drive": "r2r",
}
scoped("const propertyRows = [", "const properties = await safeInsert", (seg) => {
  for (const [nick, t] of Object.entries(tpl)) {
    seg = seg.replace("nickname: '" + nick + "'", "nickname: '" + nick + "', template: '" + t + "'")
  }
  return seg
})
scoped("await safeInsert(supabase, 'tasks', [", "// 6. JOBS", (seg) =>
  seg
    .replace(/kind: 'Compliance'/g, "kind: 'compliance'")
    .replace(/kind: 'Maintenance'/g, "kind: 'maintenance'")
    .replace(/kind: 'Insurance'/g, "kind: 'compliance'")
    .replace(/kind: 'Lettings'/g, "kind: 'turnover'")
    .replace(/kind: '[A-Z][^']*'/g, "kind: 'general'"),
)
writeFileSync(f, s)
console.log("templates:", (s.match(/template: '/g) || []).length, "| valid kinds:", (s.match(/kind: '(general|compliance|maintenance|turnover|admin|inspection)'/g) || []).length)
