import "server-only"
import { chromium, type Browser } from "playwright"

/**
 * Shared HTML → PDF renderer (headless Chromium). Used for all enterprise-grade
 * branded documents (invoices, bills, statements). One browser is reused across
 * requests for speed; pages are isolated per render.
 */

let _browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (!_browserPromise) {
    _browserPromise = chromium.launch({ headless: true, args: ["--no-sandbox"] })
  }
  try {
    const b = await _browserPromise
    if (!b.isConnected()) throw new Error("disconnected")
    return b
  } catch {
    _browserPromise = chromium.launch({ headless: true, args: ["--no-sandbox"] })
    return _browserPromise
  }
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser()
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    await page.setContent(html, { waitUntil: "networkidle" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    })
    return new Uint8Array(pdf)
  } finally {
    await context.close()
  }
}
