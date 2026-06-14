// Runs the security/isolation + gate test suites in sequence.
// Usage: node scripts/test/run-all.mjs
import { spawnSync } from "node:child_process"

const suites = [
  ["RLS multi-workspace isolation + IDOR", "scripts/test/rls-isolation.mjs"],
  ["Subscription / feature gates", "scripts/test/billing-gates.mjs"],
]

let failed = 0
for (const [name, file] of suites) {
  console.log(`\n──────── ${name} ────────`)
  const r = spawnSync(process.execPath, [file], { stdio: "inherit" })
  if (r.status !== 0) failed++
}
console.log(`\n════════ ${suites.length - failed}/${suites.length} suites passed ════════`)
process.exit(failed > 0 ? 1 : 0)
