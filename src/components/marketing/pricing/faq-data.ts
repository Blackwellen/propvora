// Single source of truth for the pricing FAQ — consumed by both the on-page
// accordion (PricingFAQ.tsx) and the FAQPage JSON-LD on the pricing route.
export const pricingFaqs: { q: string; a: string }[] = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any point from your account settings. Upgrades take effect immediately, and you'll be charged a prorated amount for the remainder of the billing period. Downgrades take effect at the next renewal date.",
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing is charged once per year and works out roughly two months cheaper than paying monthly. Monthly billing is charged every month and can be cancelled at any time. You can switch between them from your account settings.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All payments are processed securely and your card details are never stored on our servers.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan comes with a 7-day free trial, and no credit card is required to start. You'll have full access to all features on your chosen plan during the trial period.",
  },
  {
    q: "Do you charge per property or per user?",
    a: "No per-property charges. Each plan includes a generous property and team-seat allowance shown in the comparison table above. If you need more, you can add extra properties or seats as add-ons rather than moving to a different pricing model.",
  },
  {
    q: "What happens when I cancel?",
    a: "You can cancel your subscription at any time from your account settings. You'll retain full access to your workspace until the end of your current billing period. After that, your workspace moves to read-only mode for 30 days, giving you time to export your data.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 7 days of a paid subscription, contact us and we'll issue a full refund. After 7 days, we don't offer refunds for the current billing period, but you can cancel to prevent future charges. Annual plans may be refunded on a pro-rata basis as set out in our Terms.",
  },
  {
    q: "Is my property data secure?",
    a: "Absolutely. All data is encrypted in transit and at rest. We use Supabase with row-level security, and each workspace is fully isolated from others. We are GDPR compliant and registered with the ICO.",
  },
  {
    q: "Do suppliers pay to join?",
    a: "No. Suppliers join Propvora free. Optional supplier add-ons — such as a Pro Profile, team tools or emergency availability — are managed inside the supplier workspace.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your portfolio data, contacts, financial records and more from your workspace at any time.",
  },
]
