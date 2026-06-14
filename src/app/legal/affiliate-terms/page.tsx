import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Affiliate Terms | Propvora",
  description: "Propvora Affiliate Programme terms — 20% recurring commission, 12-month tracking, payout terms, and programme rules.",
}

export default function AffiliateTermsPage() {
  return (
    <LegalLayout title="Affiliate Terms & Conditions" lastUpdated="2 June 2025">
      <Section num="1" title="Programme Overview">
        <p>
          The Propvora Affiliate Programme (&ldquo;Programme&rdquo;) allows approved participants (&ldquo;Affiliates&rdquo;) to earn commission by referring new paying customers to Propvora. These Affiliate Terms (&ldquo;Terms&rdquo;) govern participation in the Programme and form a legally binding agreement between you (the Affiliate) and Propvora Ltd.
        </p>
        <p>
          Participation in the Programme is available to Propvora Business plan subscribers. By applying to and participating in the Programme, you agree to these Terms in full.
        </p>
      </Section>

      <Section num="2" title="Eligibility and Application">
        <p>To participate in the Programme, you must:</p>
        <ul>
          <li>Hold an active Propvora Business plan subscription</li>
          <li>Be at least 18 years old and legally capable of entering a contract</li>
          <li>Have a valid bank account or PayPal account for payouts</li>
          <li>Comply with all applicable laws regarding promotional activities in your jurisdiction</li>
          <li>Not be an employee, director, or contractor of Propvora Ltd</li>
        </ul>
        <p>
          Propvora reserves the right to reject or revoke Programme participation at its sole discretion, including where we believe an Affiliate is engaged in promotional methods that could damage Propvora&rsquo;s reputation.
        </p>
      </Section>

      <Section num="3" title="Commission Structure">
        <p>Affiliates earn the following commission:</p>
        <ul>
          <li><strong>Rate:</strong> 20% of the monthly subscription fee paid by each referred customer</li>
          <li><strong>Duration:</strong> Commission is paid for 12 months from the date of the referred customer&rsquo;s first payment</li>
          <li><strong>Recurring:</strong> Commission is paid monthly as long as the referred customer&rsquo;s subscription remains active, up to the 12-month limit</li>
          <li><strong>Plan coverage:</strong> Commission applies to Starter, Pro, and Business plans</li>
          <li><strong>Annual plans:</strong> Commission on annual plans is paid as 20% of the effective monthly rate, paid monthly over 12 months</li>
        </ul>

        <h3>Commission Calculation Examples</h3>
        <ul>
          <li>Referred customer on Pro monthly (£79/mo): Commission = £15.80/mo for up to 12 months (max £189.60)</li>
          <li>Referred customer on Business monthly (£149/mo): Commission = £29.80/mo for up to 12 months (max £357.60)</li>
          <li>Referred customer on Starter monthly (£29/mo): Commission = £5.80/mo for up to 12 months (max £69.60)</li>
        </ul>

        <p>
          Commission is not payable on trial periods, refunded payments, add-on purchases, or enterprise custom contracts unless otherwise agreed in writing.
        </p>
      </Section>

      <Section num="4" title="Tracking and Attribution">
        <p>
          Each Affiliate is assigned a unique referral link via the Affiliate Dashboard in their Propvora workspace. Referrals are tracked using first-touch attribution with a 30-day cookie window. This means:
        </p>
        <ul>
          <li>A referral is attributed to you when a visitor clicks your unique link and signs up within 30 days</li>
          <li>If a visitor clicks multiple affiliate links, the first-touch link is credited</li>
          <li>The 30-day cookie window resets each time the visitor clicks your link</li>
          <li>Self-referrals (referring your own account) are not permitted and will be disqualified</li>
        </ul>
        <p>
          Propvora&rsquo;s tracking records are final in all attribution disputes.
        </p>
      </Section>

      <Section num="5" title="Payouts">
        <p>
          Commission is paid monthly, subject to the following conditions:
        </p>
        <ul>
          <li><strong>Minimum payout threshold:</strong> £50. If your earned commission is below £50 in a month, it rolls over to the next month</li>
          <li><strong>Payment method:</strong> Bank transfer or PayPal, as selected in your Affiliate Dashboard</li>
          <li><strong>Payment date:</strong> Within 14 business days of the end of each calendar month, subject to clearance of referred customer payments</li>
          <li><strong>Chargeback/refund deductions:</strong> If a referred customer receives a refund, the corresponding commission will be deducted from your next payout</li>
          <li><strong>Currency:</strong> All payouts are made in GBP</li>
        </ul>
      </Section>

      <Section num="6" title="Permitted Promotion Methods">
        <p>You may promote Propvora through:</p>
        <ul>
          <li>Your own website, blog, or social media channels</li>
          <li>Email newsletters to your existing audience (with appropriate consent under PECR/UK GDPR)</li>
          <li>YouTube, podcast, or video content</li>
          <li>In-person property networking events and communities</li>
          <li>Honest reviews and case studies</li>
        </ul>
      </Section>

      <Section num="7" title="Prohibited Promotion Methods">
        <p>You must not promote Propvora through:</p>
        <ul>
          <li>Unsolicited bulk email (spam) or cold messaging</li>
          <li>Paid search ads using the &ldquo;Propvora&rdquo; brand name or variations without our prior written consent</li>
          <li>Coupon or cashback websites (unless pre-approved)</li>
          <li>Misleading, false, or exaggerated claims about the Service</li>
          <li>Automated click fraud or artificial traffic generation</li>
          <li>Content that discredits competitors in ways that are untrue or defamatory</li>
          <li>Any method that violates the UK CAP Code or ASA guidelines for advertising</li>
        </ul>
        <p>
          All promotional materials must clearly identify you as an affiliate earning commission from Propvora, in compliance with the UK Competition and Markets Authority guidelines on endorsements and influencer marketing.
        </p>
      </Section>

      <Section num="8" title="Intellectual Property">
        <p>
          Propvora grants you a limited, non-exclusive, revocable licence to use the Propvora name, logo, and approved marketing materials solely for the purpose of promoting the Service in accordance with these Terms. You must use the most current brand assets provided in your Affiliate Dashboard. You may not alter, distort, or misrepresent Propvora&rsquo;s brand.
        </p>
      </Section>

      <Section num="9" title="Tax Responsibilities">
        <p>
          You are solely responsible for all tax obligations arising from commission payments received under the Programme, including but not limited to income tax and VAT. Propvora will issue commission payments gross (without deducting tax). If you are VAT registered and commission payments constitute a supply for VAT purposes, you are responsible for accounting for VAT accordingly. Propvora may require you to provide a valid invoice for commission payments. Propvora is not your employer and commission payments are not employment income.
        </p>
      </Section>

      <Section num="10" title="Programme Changes and Termination">
        <p>
          Propvora reserves the right to modify commission rates, tracking rules, or Programme terms with 30 days&rsquo; notice. Material changes will be communicated by email to your registered account address.
        </p>
        <p>
          Either party may terminate Programme participation at any time. Upon termination, you will receive all earned commission for confirmed referrals up to the date of termination, subject to the minimum payout threshold. Commission tracking ceases immediately upon termination.
        </p>
        <p>
          Propvora may terminate your participation immediately and withhold unpaid commission for violations of these Terms, fraudulent activity, or reputational harm to Propvora.
        </p>
      </Section>

      <Section num="11" title="Governing Law">
        <p>
          These Affiliate Terms are governed by the laws of England and Wales. Disputes shall be resolved in the courts of England and Wales.
        </p>
        <p>
          Questions: <a href="mailto:legal@propvora.com">legal@propvora.com</a>
        </p>
      </Section>
    </LegalLayout>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-baseline gap-2">
        <span className="text-blue-600 text-base font-bold">{num}.</span>
        {title}
      </h2>
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2">
        {children}
      </div>
    </div>
  )
}
