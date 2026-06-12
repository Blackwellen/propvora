import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { join } from 'path'

const BASE = 'http://localhost:3001'
const OUT = 'public/screenshots'

const pages = [
  { path: '/', name: 'landing', width: 1440, height: 900 },
  { path: '/login', name: 'login', width: 1440, height: 900 },
  { path: '/register', name: 'register', width: 1440, height: 900 },
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ deviceScaleFactor: 2 })

import { mkdirSync } from 'fs'
mkdirSync(OUT, { recursive: true })

for (const p of pages) {
  const page = await context.newPage()
  await page.setViewportSize({ width: p.width, height: p.height })
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(1500)
  const file = `${OUT}/${p.name}.png`
  await page.screenshot({ path: file, fullPage: false })
  console.log(`✓ ${file}`)
  await page.close()
}

await browser.close()
console.log('Done.')
