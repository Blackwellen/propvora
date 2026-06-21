/**
 * Booking / direct-booking legal registry — the single source of truth (in app
 * code) for the booking-side legal documents: their slug, audience, current
 * version, summary and plain-English body.
 *
 * Mirrors the seeded rows in public.booking_legal_documents (migration
 * 20260617090000_legal_ical_xc.sql). The DB table is the durable mirror used by
 * the acceptance audit; THIS registry is what the public legal pages and the
 * checkout acceptance gate import, so the version shown to a guest/host and the
 * version recorded on acceptance are guaranteed to match.
 *
 * Entity framing (read src/lib/legal/company.ts at render time): every document
 * is published by Blackwellen Ltd t/a Propvora. For DIRECT bookings taken
 * through a host's own Propvora booking page, the contract for the stay is
 * between the GUEST and the HOST (the operator / property manager). Propvora is
 * a software FACILITATOR — it provides the booking page, calendar, messaging,
 * channel sync and (where enabled) payment rails. Propvora is NOT the host,
 * landlord, letting agent, travel agent, insurer, tax adviser or legal adviser,
 * and is NOT authorised or regulated by the FCA.
 *
 * Jurisdiction: 'GB' is the reviewed jurisdiction. Other jurisdictions are
 * served the same documents as GENERAL terms with a "local law may vary" note.
 */

import { COMPANY } from "./company"

export type BookingAudience = "guest" | "host" | "both"

export type BookingPolicySlug =
  // Guest / booking-facing
  | "booking-terms"
  | "guest-terms"
  | "direct-booking-terms"
  | "booking-cancellation-policy"
  | "booking-refund-policy"
  | "damage-deposit-policy"
  | "house-rules-policy"
  | "booking-payment-terms"
  | "guest-data-notice"
  | "safety-emergency-disclaimer"
  | "booking-review-policy"
  // Host / property-manager-facing
  | "host-terms"
  | "host-payout-terms"
  | "host-tax-disclaimer"
  | "host-compliance-disclaimer"
  | "listing-accuracy-warranty"
  | "host-insurance-disclaimer"
  | "channel-sync-disclaimer"
  | "booking-ai-disclaimer"

/** A paragraph of plain-English body, or a bullet list, in render order. */
export type LegalBlock =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }

export interface BookingPolicyMeta {
  slug: BookingPolicySlug
  title: string
  audience: BookingAudience
  /** Short plain-English description for the index / acceptance UI. */
  summary: string
  /** Version string; matches the seeded DB row + is recorded on acceptance. */
  currentVersion: string
  /** Effective date (ISO yyyy-mm-dd) shown on the page. */
  effectiveFrom: string
  /** Reviewed jurisdiction(s). GB is the reviewed locale; others get a note. */
  jurisdictions: string[]
  /** Public route for the rendered policy page. */
  href: string
  /** The rendered plain-English body. */
  body: LegalBlock[]
}

const VERSION = "2026-06-16"
const EFFECTIVE = "2026-06-16"
const BRAND = COMPANY.brand
const ENTITY = `${COMPANY.legalName} (company no. ${COMPANY.companyNumber})`

/** Standard facilitator framing block reused across documents. */
function facilitatorBlock(): LegalBlock {
  return {
    kind: "p",
    text:
      `${BRAND} is a trading name of ${ENTITY}. ${BRAND} provides booking and ` +
      `property-management software. For a direct booking taken through a host's ` +
      `own ${BRAND} booking page, the contract for the stay is between you (the ` +
      `guest) and the host (the operator or property manager). ${BRAND} is not the ` +
      `host, landlord, letting agent, travel agent, insurer, or tax/legal adviser, ` +
      `and is not authorised or regulated by the Financial Conduct Authority.`,
  }
}

export const BOOKING_POLICIES: Record<BookingPolicySlug, BookingPolicyMeta> = {
  // ── GUEST / BOOKING-FACING ─────────────────────────────────────────────
  "booking-terms": {
    slug: "booking-terms",
    title: "Booking Terms",
    audience: "guest",
    summary:
      "The umbrella terms for booking a stay through a host's Propvora booking page — Propvora's role as software facilitator, who your contract is with, and how a booking is formed.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-terms",
    body: [
      { kind: "p", text: "These Booking Terms apply when you book a stay through a host's booking page powered by Propvora." },
      facilitatorBlock(),
      { kind: "h2", text: "How a booking is formed" },
      { kind: "p", text: "When you submit a booking and complete any required payment, you make an offer to book the dates shown. The booking is confirmed when the host (or the host's instant-book settings) accepts it and you receive a confirmation. Until then, dates are held only on a provisional basis and may be released." },
      { kind: "h2", text: "Your contract" },
      { kind: "p", text: "Your contract for the stay — including check-in, the property's condition, and the services provided during your stay — is with the host. Propvora is not a party to that contract. Propvora provides the booking page, calendar, messaging and, where the host has enabled it, payment processing." },
      { kind: "h2", text: "Accurate information" },
      { kind: "p", text: "You agree to give accurate guest details, to use the property only for the number of guests and the purpose agreed, and to comply with the House Rules, the Cancellation Policy and the Payment Terms that the host has attached to the listing. Those documents form part of your booking." },
      { kind: "h2", text: "Changes and cancellations" },
      { kind: "p", text: "Changes and cancellations are governed by the Cancellation Policy and Refund Policy shown for your booking at the time you book. Your statutory rights as a consumer are not affected." },
      { kind: "h2", text: "Liability" },
      { kind: "p", text: "Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law. Subject to that, Propvora's role is limited to providing the booking software; the host is responsible for the stay itself." },
    ],
  },
  "guest-terms": {
    slug: "guest-terms",
    title: "Guest Terms",
    audience: "guest",
    summary:
      "Your responsibilities as a guest — accurate details, who may stay, care of the property, conduct, and what happens if rules are broken.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/guest-terms",
    body: [
      { kind: "p", text: "These Guest Terms set out what is expected of you as a guest when you book and stay at a property through Propvora." },
      facilitatorBlock(),
      { kind: "h2", text: "Your responsibilities" },
      { kind: "ul", items: [
        "Give accurate information about yourself and your party when booking.",
        "Only allow the number of guests agreed with the host to stay.",
        "Treat the property, its contents and its neighbours with care and respect.",
        "Follow the House Rules and any check-in / check-out instructions the host provides.",
        "Report any damage, faults or safety issues to the host promptly.",
      ] },
      { kind: "h2", text: "Prohibited conduct" },
      { kind: "ul", items: [
        "Unauthorised parties, events or commercial filming.",
        "Smoking where the host has stated the property is non-smoking.",
        "Exceeding the agreed guest count or bringing undisclosed pets.",
        "Any unlawful activity, or causing a nuisance to neighbours.",
      ] },
      { kind: "h2", text: "If rules are broken" },
      { kind: "p", text: "The host may decline or end a stay, retain part or all of a deposit (see the Damage & Deposit Policy), or recover reasonable costs where you cause loss or damage. Serious or repeated breaches may also lead to your Propvora guest account being restricted." },
      { kind: "h2", text: "Your rights" },
      { kind: "p", text: "You keep all rights you have as a consumer under applicable law, including in relation to misdescription, cancellation and refunds. These terms do not exclude or limit those rights." },
    ],
  },
  "direct-booking-terms": {
    slug: "direct-booking-terms",
    title: "Direct Booking Terms",
    audience: "guest",
    summary:
      "How direct bookings work when you book straight with a host through their own Propvora page rather than through a third-party channel like Airbnb or Booking.com.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/direct-booking-terms",
    body: [
      { kind: "p", text: "A direct booking is one you make straight with a host through their own Propvora booking page, rather than through a third-party travel platform such as Airbnb, Booking.com or Vrbo." },
      facilitatorBlock(),
      { kind: "h2", text: "What's different about a direct booking" },
      { kind: "ul", items: [
        "Your contract and customer relationship are directly with the host.",
        "Third-party platform protections (such as that platform's guarantee or resolution centre) do not apply — those only cover bookings made through that platform.",
        "The host's own Cancellation, Refund, Payment and House Rules policies govern your stay.",
      ] },
      { kind: "h2", text: "Payments" },
      { kind: "p", text: "Where the host has enabled online payment, it is processed by a regulated payment provider (such as Stripe). Where the host takes payment another way (for example a bank transfer or on arrival), that arrangement is between you and the host and Propvora is not involved in collecting or holding those funds." },
      { kind: "h2", text: "Confirmation" },
      { kind: "p", text: "Keep the confirmation and the policy documents shown at the time of booking. They are the record of what you agreed with the host. If anything is unclear, contact the host before you travel." },
    ],
  },
  "booking-cancellation-policy": {
    slug: "booking-cancellation-policy",
    title: "Booking Cancellation Policy",
    audience: "guest",
    summary:
      "How cancellations work for a stay, the cancellation tiers a host may set, and your statutory cancellation rights where they apply.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-cancellation-policy",
    body: [
      { kind: "p", text: "Each listing shows the cancellation tier the host has chosen. The tier that applies to your booking is the one shown at the time you book, and it determines what (if anything) is refundable if you cancel." },
      { kind: "h2", text: "Cancellation tiers" },
      { kind: "ul", items: [
        "Flexible — full refund of the accommodation cost if you cancel at least 1 day before check-in.",
        "Moderate — full refund if you cancel at least 5 days before check-in; partial after that.",
        "Strict — partial refund only if you cancel well in advance (typically 14+ days); limited or no refund close to check-in.",
        "Non-refundable — no refund of the accommodation cost on cancellation, in exchange for a lower price.",
        "Custom — the specific terms the host has written for the listing, shown at booking.",
      ] },
      { kind: "h2", text: "Service fees and taxes" },
      { kind: "p", text: "Any Propvora or payment-processing fee is shown separately at checkout. Whether a fee is refundable on cancellation is stated at the time you book." },
      { kind: "h2", text: "Host cancellations" },
      { kind: "p", text: "If a host cancels a confirmed booking, you are entitled to a full refund of amounts you paid for that booking. The host is responsible for any consequences of a host-side cancellation." },
      { kind: "h2", text: "Your statutory rights" },
      { kind: "p", text: "Some consumer cancellation rights (for example for off-premises or distance contracts) may not apply to short-term accommodation booked for a specific date. Where statutory rights do apply, this policy does not reduce them." },
    ],
  },
  "booking-refund-policy": {
    slug: "booking-refund-policy",
    title: "Booking Refund Policy",
    audience: "guest",
    summary:
      "When and how refunds are issued for a stay, who decides them, and how money is returned to your payment method.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-refund-policy",
    body: [
      { kind: "p", text: "Refunds are governed by the Cancellation Policy shown for your booking and by your statutory rights. This policy explains how a refund, once due, is processed." },
      facilitatorBlock(),
      { kind: "h2", text: "Who decides a refund" },
      { kind: "p", text: "Because your contract is with the host, the host decides discretionary refunds (for example a goodwill refund outside the cancellation tier). Where the host has enabled Propvora-processed payments, an agreed refund is returned to your original payment method via the payment provider." },
      { kind: "h2", text: "How refunds are paid" },
      { kind: "ul", items: [
        "Refunds go back to the card or payment method you used.",
        "Card refunds typically appear within 5–10 business days, depending on your bank.",
        "Where the host took payment off-platform, the host issues the refund directly.",
      ] },
      { kind: "h2", text: "Disputes" },
      { kind: "p", text: "If you and the host disagree about a refund, raise it with the host first. Propvora can provide a record of the booking and any policy you accepted, but Propvora is not the decision-maker on the underlying stay and does not adjudicate the contract between you and the host." },
    ],
  },
  "damage-deposit-policy": {
    slug: "damage-deposit-policy",
    title: "Damage & Deposit Policy",
    audience: "both",
    summary:
      "How security deposits and damage charges work — when a deposit may be taken, what it covers, and how disputes about damage are handled.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/damage-deposit-policy",
    body: [
      { kind: "p", text: "A host may require a refundable security deposit or hold against damage. Where one applies, the amount and terms are shown on the listing before you book." },
      { kind: "h2", text: "What a deposit covers" },
      { kind: "ul", items: [
        "Damage beyond reasonable wear and tear.",
        "Missing items or excessive cleaning required after the stay.",
        "Costs caused by breaking the House Rules (for example an unauthorised party).",
      ] },
      { kind: "h2", text: "How a deposit is handled" },
      { kind: "p", text: "Where the host uses Propvora-processed payments, a deposit may be taken as a pre-authorisation hold or a separate charge, and is released or refunded after check-out once the property has been checked. A host who claims against a deposit should give a reasonable explanation and evidence of the loss." },
      { kind: "h2", text: "Disputes about damage" },
      { kind: "p", text: "Damage claims are between the guest and the host. Both should keep dated photos and notes. Propvora is not the assessor of damage and does not hold deposits as a stakeholder; it provides the record of the booking and the policy accepted." },
      { kind: "h2", text: "For hosts" },
      { kind: "p", text: "If you set a deposit, describe clearly what it covers, claim only for genuine, evidenced loss, and release it promptly when no claim is made. Unfair or unsupported deductions may breach consumer law and the Host Terms." },
    ],
  },
  "house-rules-policy": {
    slug: "house-rules-policy",
    title: "House Rules Policy",
    audience: "both",
    summary:
      "How a host's House Rules work, the kinds of rules a host may set, and the limits on what House Rules can require.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/house-rules-policy",
    body: [
      { kind: "p", text: "House Rules are the property-specific conditions a host attaches to a listing. By booking, you agree to follow the House Rules shown for that property." },
      { kind: "h2", text: "Typical House Rules" },
      { kind: "ul", items: [
        "Check-in and check-out times and any quiet hours.",
        "Whether smoking, pets, parties or events are allowed.",
        "Maximum guest numbers and visitor policy.",
        "Use of shared facilities, parking, and waste/recycling.",
      ] },
      { kind: "h2", text: "Limits on House Rules" },
      { kind: "p", text: "House Rules must be lawful, must not discriminate against guests on protected grounds, and cannot remove a guest's statutory rights. A House Rule that conflicts with the law or with these policies has no effect to the extent of the conflict." },
      { kind: "h2", text: "For hosts" },
      { kind: "p", text: "Keep House Rules clear, reasonable and accurate. They are part of the contract you offer the guest, so list anything that matters (steps, noise, local restrictions) honestly before booking — see also the Listing Accuracy Warranty." },
    ],
  },
  "booking-payment-terms": {
    slug: "booking-payment-terms",
    title: "Booking Payment Terms",
    audience: "guest",
    summary:
      "How and when you pay for a stay, what the price includes, fees, currency, and who processes the payment.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-payment-terms",
    body: [
      { kind: "p", text: "These terms explain how payment works for a stay booked through Propvora." },
      facilitatorBlock(),
      { kind: "h2", text: "Price and fees" },
      { kind: "ul", items: [
        "The total shown at checkout includes the nightly price and any host-set fees (such as cleaning) plus applicable taxes.",
        "Any Propvora or payment-processing fee is shown separately before you confirm.",
        "Prices are charged in the listing's currency; your bank may apply its own conversion.",
      ] },
      { kind: "h2", text: "When you pay" },
      { kind: "p", text: "Depending on the host's settings, you may pay in full at booking, pay a deposit now with the balance due before check-in, or pay on arrival. The schedule that applies is shown at checkout." },
      { kind: "h2", text: "Who processes payment" },
      { kind: "p", text: "Online payments are processed by Stripe, a regulated payment service provider authorised by the Financial Conduct Authority. Propvora does not store your full card number and does not hold client money. Propvora acts as a commercial agent of Stripe for the purpose of facilitating marketplace transactions. Where the host takes payment off-platform, that arrangement is directly between you and the host." },
      { kind: "h2", text: "Payment holding and release" },
      { kind: "p", text: "For stays booked through the platform, your payment is authorised at the point of booking but is not captured until shortly before your check-in date. Following check-in, funds are held for a 48-hour dispute window before being released to the host. This protects you if the property is materially different from its listing description." },
      { kind: "ul", items: [
        "You have 48 hours after check-in to raise a dispute through the platform.",
        "After 48 hours without a dispute, funds are released to the host automatically.",
        "If a dispute is raised, release is paused pending review by Propvora.",
        "Propvora's decision on disputes is final, subject to your statutory rights.",
      ] },
      { kind: "h2", text: "Failed or disputed payments" },
      { kind: "p", text: "If a payment fails, the booking may not be confirmed or may be cancelled. Do not initiate a card chargeback before contacting the host or raising a dispute through the platform — most issues can be resolved directly, and a record of the booking and accepted policies is available. Initiating a chargeback may result in suspension of your account." },
    ],
  },
  "guest-data-notice": {
    slug: "guest-data-notice",
    title: "Guest Data Processing Notice",
    audience: "guest",
    summary:
      "What guest data is collected for a booking, who acts as controller, how it is shared with the host, and your data rights.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/guest-data-notice",
    body: [
      { kind: "p", text: "This notice explains how your personal data is handled when you book a stay through Propvora. It sits alongside the main Privacy Policy." },
      { kind: "h2", text: "What we collect" },
      { kind: "ul", items: [
        "Booking details: dates, guest count, and the property booked.",
        "Contact details: name, email and phone, so the host can reach you.",
        "Payment metadata (not your full card number) where online payment is used.",
        "Acceptance evidence: which policy versions you accepted, with a timestamp and the IP address and browser used, kept as a record of consent.",
      ] },
      { kind: "h2", text: "Controllers" },
      { kind: "p", text: `${BRAND} (${ENTITY}) is the controller of the data needed to operate the platform and the acceptance record. The host is the controller of your data for the purpose of providing your stay (for example managing check-in). Each is responsible for its own use of your data.` },
      { kind: "h2", text: "Sharing" },
      { kind: "p", text: "Your booking and contact details are shared with the host so they can host your stay, and with the payment provider where online payment is used. We do not sell your data." },
      { kind: "h2", text: "Your rights" },
      { kind: "p", text: `You can request access to, correction or deletion of your data, and can object to certain processing, subject to record-keeping we must lawfully retain. Contact ${COMPANY.emails.legal} or, for the stay itself, the host. You may also complain to the ICO (${COMPANY.ico.url}).` },
    ],
  },
  "safety-emergency-disclaimer": {
    slug: "safety-emergency-disclaimer",
    title: "Safety & Emergency Disclaimer",
    audience: "both",
    summary:
      "Important safety information — Propvora does not inspect properties, guests are responsible for their own safety, and what to do in an emergency.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/safety-emergency-disclaimer",
    body: [
      { kind: "p", text: "Your safety matters. Please read this before you stay." },
      { kind: "h2", text: "Propvora does not inspect properties" },
      { kind: "p", text: "Propvora provides software. It does not visit, inspect, certify or guarantee the safety or condition of any property. Responsibility for the property's safety — fire precautions, gas and electrical safety, suitability of the accommodation — rests with the host, who must comply with the law that applies to them." },
      { kind: "h2", text: "Guest responsibility" },
      { kind: "ul", items: [
        "On arrival, locate fire exits, alarms and any fire equipment.",
        "Supervise children and anyone vulnerable in your party at all times.",
        "Use appliances, balconies, pools, hot tubs and stairs sensibly and at your own risk.",
        "Report any safety concern to the host immediately.",
      ] },
      { kind: "h2", text: "In an emergency" },
      { kind: "p", text: "In a life-threatening emergency, always contact the local emergency services first (999 in the UK; 112 across the EU). Do not rely on Propvora or the host for emergency response. For non-urgent issues during a stay, contact the host using the details in your booking." },
      { kind: "h2", text: "No liability for the stay" },
      { kind: "p", text: "Except for liability that cannot be excluded by law (including for death or personal injury caused by negligence), Propvora is not liable for incidents arising from the condition or use of a property; that responsibility lies with the host and the guest." },
    ],
  },
  "booking-review-policy": {
    slug: "booking-review-policy",
    title: "Review Policy",
    audience: "both",
    summary:
      "How guest and host reviews work — what reviews must and must not contain, and when a review may be removed.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-review-policy",
    body: [
      { kind: "p", text: "Reviews help future guests and hosts make good decisions. They must be honest and based on a genuine stay." },
      { kind: "h2", text: "What a review must be" },
      { kind: "ul", items: [
        "Based on your own genuine, completed booking.",
        "Honest, relevant and your real opinion of the stay or the guest.",
        "Free of personal data about third parties.",
      ] },
      { kind: "h2", text: "What is not allowed" },
      { kind: "ul", items: [
        "Fake, incentivised, or retaliatory reviews.",
        "Reviews used to extort a refund, discount or a positive review in return.",
        "Hate speech, harassment, or unlawful content.",
        "Content that is irrelevant to the stay (for example a platform complaint posing as a property review).",
      ] },
      { kind: "h2", text: "Moderation" },
      { kind: "p", text: "A review that breaches this policy may be removed. Propvora may remove clearly unlawful or abusive content, but does not edit the substance of genuine opinions and does not remove a review just because it is negative." },
    ],
  },

  // ── HOST / PROPERTY-MANAGER-FACING ─────────────────────────────────────
  "host-terms": {
    slug: "host-terms",
    title: "Host / Property Manager Terms",
    audience: "host",
    summary:
      "The terms for hosts and property managers who take direct bookings through Propvora — your responsibilities as the contracting party, the use of the software, and your obligations to guests.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/host-terms",
    body: [
      { kind: "p", text: "These terms apply when you use Propvora to list a property and take direct bookings as a host or property manager." },
      facilitatorBlock(),
      { kind: "h2", text: "You are the contracting party" },
      { kind: "p", text: "For every direct booking taken through your Propvora page, the contract for the stay is between you and the guest. You are responsible for the property, the stay, your guest communications, your policies, and your compliance with the law. Propvora provides the software only." },
      { kind: "h2", text: "Your obligations" },
      { kind: "ul", items: [
        "Hold the legal right to let the property and to take bookings for it.",
        "Keep listings accurate and your calendar up to date (see the Listing Accuracy Warranty).",
        "Set fair, lawful policies and honour the ones a guest accepted at booking.",
        "Meet your safety, licensing, tax and data-protection obligations.",
        "Handle guest data only as needed to provide the stay.",
      ] },
      { kind: "h2", text: "Acceptable use" },
      { kind: "p", text: "You must not use Propvora to take bookings for unlawful lettings, to mislead guests, or to evade fees. Serious or repeated breaches may lead to suspension of your booking pages." },
      { kind: "h2", text: "Liability between us" },
      { kind: "p", text: "Propvora is not liable for the stay itself or for disputes with your guests. To the extent permitted by law, you are responsible for claims arising from your property and your bookings. Nothing here excludes liability that cannot be excluded by law." },
    ],
  },
  "host-payout-terms": {
    slug: "host-payout-terms",
    title: "Host Payout Terms",
    audience: "host",
    summary:
      "How host payouts work where Propvora-processed payments are enabled — the payment provider, timing, fees, and that Propvora does not hold your funds as a bank.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/host-payout-terms",
    body: [
      { kind: "p", text: "These terms apply where you have enabled online payments so guests pay through your Propvora booking page." },
      facilitatorBlock(),
      { kind: "h2", text: "Who moves the money" },
      { kind: "p", text: "Payments and payouts are handled by a regulated third-party payment provider (such as Stripe), under that provider's own connected-account terms which you accept when you onboard. Propvora is not a bank, money transmitter or e-money institution, does not hold client money, and is not authorised by the FCA." },
      { kind: "h2", text: "Payout timing and fees" },
      { kind: "ul", items: [
        "Funds settle to your connected payout account on the schedule set by the payment provider and your settings.",
        "Payment-processing fees and any Propvora platform fee are disclosed and deducted before payout.",
        "Refunds, chargebacks and disputes may reduce or reverse a payout in line with the provider's terms.",
      ] },
      { kind: "h2", text: "Your responsibilities" },
      { kind: "p", text: "Keep your payout and verification details accurate, respond to the provider's KYC requests, and account for your own tax on the income (see the Host Tax Disclaimer). You are responsible for issuing refunds you agree with guests." },
    ],
  },
  "host-tax-disclaimer": {
    slug: "host-tax-disclaimer",
    title: "Host Tax Disclaimer",
    audience: "host",
    summary:
      "Propvora is not a tax adviser. You are responsible for your own tax, VAT, tourist taxes and reporting obligations on your letting income.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/host-tax-disclaimer",
    body: [
      { kind: "p", text: "This is important information about tax. Please read it and take your own advice." },
      { kind: "h2", text: "Propvora is not a tax adviser" },
      { kind: "p", text: "Propvora provides software, not tax advice. Figures, summaries or reports in the product are for your convenience only and are not a tax return, tax advice, or a statement of what you owe." },
      { kind: "h2", text: "Your tax responsibilities" },
      { kind: "ul", items: [
        "Declaring your letting income to the relevant tax authority and paying any income or corporation tax due.",
        "Assessing whether VAT applies to your lettings or services and accounting for it correctly.",
        "Collecting and remitting any local tourist, occupancy or city taxes that apply where the property is.",
        "Meeting any platform-reporting or registration rules that apply to you.",
      ] },
      { kind: "h2", text: "Get advice" },
      { kind: "p", text: "Tax rules differ by country and change over time. Consult a qualified accountant or tax adviser for your situation. Propvora is not liable for tax assessed, penalties, or interest arising from your lettings." },
    ],
  },
  "host-compliance-disclaimer": {
    slug: "host-compliance-disclaimer",
    title: "Local Compliance Disclaimer",
    audience: "host",
    summary:
      "You are responsible for local short-let licensing, registration, planning and safety rules. Propvora does not verify or guarantee your compliance.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/host-compliance-disclaimer",
    body: [
      { kind: "p", text: "Short-term letting is regulated differently in different places. You are responsible for following the rules that apply to your property." },
      { kind: "h2", text: "Your compliance obligations" },
      { kind: "ul", items: [
        "Short-let licensing or registration schemes (for example local registration numbers or night caps).",
        "Planning permission and any limits on the number of let nights per year.",
        "Fire, gas, electrical and furniture safety requirements.",
        "Mortgage, lease, freeholder, insurer and HOA/management-company consents.",
        "Accessibility and any sector-specific rules that apply to you.",
      ] },
      { kind: "h2", text: "Propvora does not verify compliance" },
      { kind: "p", text: "A field in the product for a licence or registration number is a record you provide; Propvora does not check or guarantee that you are licensed or compliant. Listing a property does not imply Propvora has assessed its legality." },
      { kind: "h2", text: "Consequences" },
      { kind: "p", text: "Operating without required permissions can lead to fines or enforcement against you. You are solely responsible for that risk; Propvora is not liable for the consequences of non-compliant letting." },
    ],
  },
  "listing-accuracy-warranty": {
    slug: "listing-accuracy-warranty",
    title: "Listing Accuracy Warranty",
    audience: "host",
    summary:
      "You warrant that your listing — photos, description, amenities, pricing and availability — is accurate and not misleading. Propvora does not verify listings.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/listing-accuracy-warranty",
    body: [
      { kind: "p", text: "Guests rely on your listing when they book. You are responsible for making it accurate." },
      { kind: "h2", text: "You warrant that" },
      { kind: "ul", items: [
        "Photos are of the actual property and reasonably current.",
        "The description, amenities, sleeping arrangements and location are accurate.",
        "Pricing, fees and any deposit are stated correctly before booking.",
        "Your calendar reflects true availability, including dates blocked via channel sync.",
        "You have the right to use any images and content you upload.",
      ] },
      { kind: "h2", text: "No verification by Propvora" },
      { kind: "p", text: "Propvora does not inspect properties or verify listing content. Publishing a listing does not mean Propvora has confirmed it is accurate." },
      { kind: "h2", text: "If a listing is inaccurate" },
      { kind: "p", text: "A materially inaccurate or misleading listing can breach consumer-protection law and the Host Terms, may entitle a guest to a remedy, and may lead Propvora to require correction or to suspend the listing. You are responsible for the consequences of inaccuracies you publish." },
    ],
  },
  "host-insurance-disclaimer": {
    slug: "host-insurance-disclaimer",
    title: "Insurance Disclaimer",
    audience: "host",
    summary:
      "Propvora does not provide insurance or any host guarantee. You are responsible for arranging your own appropriate cover.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/host-insurance-disclaimer",
    body: [
      { kind: "p", text: "Please make sure your property and lettings are properly insured." },
      { kind: "h2", text: "No insurance and no guarantee" },
      { kind: "p", text: "Propvora is not an insurer and is not authorised to arrange or advise on insurance. Propvora does not provide a host guarantee, damage protection, host liability cover, or any equivalent scheme. Any deposit a guest pays is a contractual security between you and the guest, not insurance." },
      { kind: "h2", text: "Arrange your own cover" },
      { kind: "ul", items: [
        "Buildings and contents cover that permits short-term letting.",
        "Public liability cover for guests and visitors.",
        "Loss-of-income or accidental-damage cover if you want it.",
        "Confirmation from your insurer that short-term letting is permitted under your policy.",
      ] },
      { kind: "h2", text: "Your responsibility" },
      { kind: "p", text: "It is your responsibility to hold adequate, valid insurance for your lettings. Propvora is not liable for uninsured loss, damage or liability arising from your property or bookings." },
    ],
  },
  "channel-sync-disclaimer": {
    slug: "channel-sync-disclaimer",
    title: "Channel Sync Disclaimer",
    audience: "host",
    summary:
      "How iCal channel sync works and its limits — sync is periodic, not instant, and you remain responsible for avoiding double-bookings.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/channel-sync-disclaimer",
    body: [
      { kind: "p", text: "Channel sync lets you share availability between Propvora and other platforms (such as Airbnb, Booking.com, Vrbo, Google or Outlook) using the iCal standard. Please understand its limits." },
      { kind: "h2", text: "How iCal sync works" },
      { kind: "ul", items: [
        "Export: Propvora publishes a private calendar feed of your blocked and booked dates (dates only — no guest details) that other platforms can subscribe to.",
        "Import: Propvora periodically reads an iCal URL you provide from another platform and blocks those dates on your Propvora calendar.",
      ] },
      { kind: "h2", text: "Limitations — read carefully" },
      { kind: "ul", items: [
        "iCal sync is PERIODIC, not real-time. Each platform refreshes on its own schedule (often every few hours), so there is always a window where a date can be double-booked on two platforms before sync catches up.",
        "iCal carries dates only — not prices, guest details, or booking status — so it cannot prevent every conflict.",
        "If an external URL changes, expires or returns an error, those dates may stop syncing until you fix the connection.",
      ] },
      { kind: "h2", text: "Your responsibility" },
      { kind: "p", text: "You remain responsible for managing availability across your channels and for resolving any double-booking that sync timing does not prevent. Propvora surfaces detected conflicts and the last sync status, but does not guarantee that calendars are perfectly in step at every moment, and is not liable for double-bookings caused by the timing or failure of a third-party calendar feed." },
    ],
  },
  "booking-ai-disclaimer": {
    slug: "booking-ai-disclaimer",
    title: "AI Use Disclaimer",
    audience: "both",
    summary:
      "How AI assistance is used in the booking product, its limits, and that a human remains responsible for decisions and guest communications.",
    currentVersion: VERSION,
    effectiveFrom: EFFECTIVE,
    jurisdictions: ["GB"],
    href: "/legal/booking-ai-disclaimer",
    body: [
      { kind: "p", text: "Propvora may offer AI features to help draft listings, suggest pricing, or summarise messages. This explains how to rely on them." },
      { kind: "h2", text: "AI assists — it does not decide" },
      { kind: "p", text: "AI output is a suggestion to help you, not a decision or professional advice. It can be wrong, incomplete or out of date. A human (the host) is responsible for reviewing and approving anything AI produces before it is used or sent to a guest." },
      { kind: "h2", text: "Limits" },
      { kind: "ul", items: [
        "AI does not give legal, tax, insurance or compliance advice.",
        "AI-suggested prices are estimates, not a guarantee of revenue.",
        "AI must not be used to mislead guests or to write fake reviews.",
      ] },
      { kind: "h2", text: "Responsibility" },
      { kind: "p", text: "You are responsible for content you publish or send, whether or not AI helped produce it, including its accuracy under the Listing Accuracy Warranty. Propvora is not liable for decisions made in reliance on AI output." },
    ],
  },
}

/** All booking policies as an ordered array (registry display order). */
export const BOOKING_POLICY_LIST: BookingPolicyMeta[] = Object.values(BOOKING_POLICIES)

/** Guest-facing documents (audience guest or both). */
export const GUEST_POLICY_LIST: BookingPolicyMeta[] = BOOKING_POLICY_LIST.filter(
  (p) => p.audience === "guest" || p.audience === "both",
)

/** Host-facing documents (audience host or both). */
export const HOST_POLICY_LIST: BookingPolicyMeta[] = BOOKING_POLICY_LIST.filter(
  (p) => p.audience === "host" || p.audience === "both",
)

/** Lookup a booking policy by slug. Returns undefined for unknown slugs. */
export function getBookingPolicy(slug: string): BookingPolicyMeta | undefined {
  return (BOOKING_POLICIES as Record<string, BookingPolicyMeta>)[slug]
}

/** True when `slug` is a known booking policy slug. */
export function isBookingPolicySlug(slug: string): slug is BookingPolicySlug {
  return Object.prototype.hasOwnProperty.call(BOOKING_POLICIES, slug)
}

/** Current version string for a booking policy slug, or null if unknown. */
export function bookingPolicyVersion(slug: string): string | null {
  return getBookingPolicy(slug)?.currentVersion ?? null
}

/**
 * The documents that MUST be presented and accepted for a given role/context.
 *
 *  - guest_checkout  → the core guest set a guest accepts to confirm a booking:
 *                      Booking Terms, Guest Terms, Cancellation, Payment Terms,
 *                      House Rules, Damage & Deposit, Guest Data Notice, Safety.
 *  - guest_direct    → guest_checkout plus the Direct Booking Terms (used on a
 *                      host's own direct-booking page).
 *  - host_onboarding → the host set a host accepts to start taking bookings:
 *                      Host Terms, Payout, Tax, Compliance, Accuracy, Insurance,
 *                      Channel Sync and AI disclaimers.
 */
export type LegalContext = "guest_checkout" | "guest_direct" | "host_onboarding"

export function requiredLegalFor(context: LegalContext): BookingPolicySlug[] {
  switch (context) {
    case "guest_checkout":
      return [
        "booking-terms",
        "guest-terms",
        "booking-cancellation-policy",
        "booking-payment-terms",
        "house-rules-policy",
        "damage-deposit-policy",
        "guest-data-notice",
        "safety-emergency-disclaimer",
      ]
    case "guest_direct":
      return [
        "direct-booking-terms",
        "booking-terms",
        "guest-terms",
        "booking-cancellation-policy",
        "booking-payment-terms",
        "house-rules-policy",
        "damage-deposit-policy",
        "guest-data-notice",
        "safety-emergency-disclaimer",
      ]
    case "host_onboarding":
      return [
        "host-terms",
        "host-payout-terms",
        "host-tax-disclaimer",
        "host-compliance-disclaimer",
        "listing-accuracy-warranty",
        "host-insurance-disclaimer",
        "channel-sync-disclaimer",
        "booking-ai-disclaimer",
      ]
    default:
      return ["booking-terms"]
  }
}

/**
 * Whether a booking policy has been reviewed for the given ISO country code. GB
 * is the reviewed jurisdiction; everything else is served as general terms (the
 * page shows the "local law may vary" note rather than blocking).
 */
export function isReviewedBookingJurisdiction(
  slug: string,
  countryCode: string,
): boolean {
  const p = getBookingPolicy(slug)
  if (!p) return false
  return p.jurisdictions.includes(countryCode.toUpperCase())
}
