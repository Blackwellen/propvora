import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Affiliate Terms | Propvora",
  description: "Propvora Affiliate Programme terms — 10% recurring commission (up to 15% at higher bands), 6-month tracking, payout terms, and programme rules.",
}

export default function AffiliateTermsPage() {
  return (
    <LegalLayout title="Affiliate Terms & Conditions" lastUpdated="1 July 2026">
      <Section num="1" title="Programme Overview">
        <p>
          The Propvora Affiliate Programme (&ldquo;Programme&rdquo;) allows approved participants (&ldquo;Affiliates&rdquo;) to earn commission by referring new paying customers to Propvora. These Affiliate Terms (&ldquo;Terms&rdquo;) govern participation in the Programme and form a legally binding agreement between you (the Affiliate) and Blackwellen Ltd (trading as Propvora).
        </p>
        <p>
          Anyone may apply to the Programme — you do not need to be a Propvora customer. Existing Propvora customers can also enrol directly from their workspace settings. Participation requires our approval, and by applying to and participating in the Programme, you agree to these Terms in full.
        </p>
      </Section>

      <Section num="2" title="Eligibility and Application">
        <p>To participate in the Programme, you must:</p>
        <ul>
          <li>Apply and be approved by Propvora (we may approve, reject, waitlist or request more information at our discretion)</li>
          <li>Be at least 18 years old and legally capable of entering a contract</li>
          <li>Connect a Stripe account to receive payouts (payouts are paid via Stripe Connect — see section 5)</li>
          <li>Comply with all applicable laws regarding promotional activities in your jurisdiction</li>
          <li>Not be an employee, director, or contractor of Blackwellen Ltd (trading as Propvora)</li>
        </ul>
        <p>
          Propvora reserves the right to reject or revoke Programme participation at its sole discretion, including where we believe an Affiliate is engaged in promotional methods that could damage Propvora&rsquo;s reputation.
        </p>
      </Section>

      <Section num="3" title="Commission Structure">
        <p>Affiliates earn the following commission:</p>
        <ul>
          <li><strong>Rate:</strong> 10% of the monthly subscription fee paid by each referred customer, rising to 12% (10+ active referrals) and 15% (25+ active referrals) as you reach higher partner bands</li>
          <li><strong>Duration:</strong> Commission is paid for 6 months from the date of the referred customer&rsquo;s first payment</li>
          <li><strong>Recurring:</strong> Commission is paid monthly as long as the referred customer&rsquo;s subscription remains active, up to the 6-month limit</li>
          <li><strong>Plan coverage:</strong> Commission applies to the Starter, Operator, Scale and Pro / Agency plans</li>
          <li><strong>Annual plans:</strong> Commission on annual plans is paid as 10% of the effective monthly rate, paid monthly over 6 months</li>
        </ul>

        <h3>Commission Calculation Examples</h3>
        <p>Examples use the base 10% band; higher bands earn more.</p>
        <ul>
          <li>Referred customer on Operator monthly (£79/mo): Commission = £7.90/mo for up to 6 months (max £47.40)</li>
          <li>Referred customer on Scale monthly (£169/mo): Commission = £16.90/mo for up to 6 months (max £101.40)</li>
          <li>Referred customer on Starter monthly (£29/mo): Commission = £2.90/mo for up to 6 months (max £17.40)</li>
        </ul>

        <p>
          Commission is not payable on trial periods, refunded payments, add-on purchases, or enterprise custom contracts unless otherwise agreed in writing.
        </p>
      </Section>

      <Section num="4" title="Tracking and Attribution">
        <p>
          Each Affiliate is assigned a unique referral link and code via the Affiliate Dashboard. Referrals are tracked using last-click attribution with a 60-day cookie window. This means:
        </p>
        <ul>
          <li>A referral is attributed to you when a visitor clicks your unique link and signs up to a paying subscription within 60 days</li>
          <li>If a visitor clicks multiple affiliate links, the most recent (last-click) link is credited</li>
          <li>The 60-day cookie window resets each time the visitor clicks your link</li>
          <li>Self-referrals (referring your own account) and referrals of existing customers are not permitted and will be disqualified</li>
        </ul>
        <p>
          Propvora&rsquo;s tracking records are final in all attribution disputes.
        </p>
      </Section>

      <Section num="5" title="Cooling-off, Payouts and Reversals">
        <p>
          Commission is earned only on valid, approved, paying customers and is subject to a cooling-off / chargeback hold before it can be released:
        </p>
        <ul>
          <li><strong>Hold window:</strong> New commission is held as <em>pending</em> for at least 30 days. No funds are released during this window. Commission becomes <em>payable</em> only after the referred customer&rsquo;s payment has cleared, the refund/chargeback window has passed, and the referred subscription is retained — i.e. it has not been refunded, charged back or cancelled.</li>
          <li><strong>Payment method:</strong> Payouts are made automatically via Stripe Connect to the Stripe account you connect in your Affiliate Dashboard. You must connect a Stripe account that is enabled to receive payouts before any commission can be paid.</li>
          <li><strong>Minimum payout threshold:</strong> £50. If your cleared balance is below £50 it rolls over until the threshold is met.</li>
          <li><strong>Schedule:</strong> Once commission has cleared the hold window and your cleared balance is at or above the threshold, it is paid automatically to your connected Stripe account.</li>
          <li><strong>Reversals:</strong> Commission reverses and is withheld on refund (including within the customer&rsquo;s 30-day money-back window), chargeback, dispute, cancellation, failed payment, fraud, duplicate referral or invalid attribution. Pending commission cannot be withdrawn.</li>
          <li><strong>Currency:</strong> All payouts are made in GBP.</li>
        </ul>
        <Callout type="info">
          Because a referred subscription can be refunded or charged back after it is first paid, commission is only released once that subscription has been retained past its refund/chargeback window. If the subscription is refunded or cancelled during the hold, the related commission is reversed.
        </Callout>
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
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2 [&_em]:italic">
        {children}
      </div>
    </div>
  )
}

function Callout({ type, children }: { type: "warning" | "info"; children: React.ReactNode }) {
  const styles = {
    warning: "bg-amber-50 border-amber-300 text-amber-900",
    info: "bg-blue-50 border-blue-300 text-blue-900",
  }
  return (
    <div className={`p-4 rounded-xl border-l-4 ${styles[type]} text-sm leading-relaxed my-4`}>
      {children}
    </div>
  )
}
