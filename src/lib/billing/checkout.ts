/** Client helpers to start a Stripe Checkout session or open the billing portal. */

export async function startCheckout(priceId: string): Promise<void> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.url) {
    throw new Error(json.error || "Could not start checkout")
  }
  window.location.href = json.url as string
}

export async function openBillingPortal(): Promise<void> {
  const res = await fetch("/api/billing/portal", { method: "POST" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.url) {
    throw new Error(json.error || "Billing portal unavailable")
  }
  window.open(json.url as string, "_blank")
}
