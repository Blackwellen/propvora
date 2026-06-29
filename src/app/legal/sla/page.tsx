import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Service Level Agreement | Propvora",
  description: "Propvora Service Level Agreement — availability commitment, scheduled maintenance, exclusions, service credits, and support response targets for paid plans.",
}

export default function SlaPage() {
  return (
    <LegalLayout title="Service Level Agreement" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This Service Level Agreement (&ldquo;SLA&rdquo;) forms part of the Propvora Terms of Service and applies only to customers on a paid subscription plan. It does not apply to free trials, evaluation accounts, or beta or experimental features. Service Credits are the customer&rsquo;s sole and exclusive remedy for any failure to meet the availability commitment set out below, without limiting any rights that cannot be excluded under applicable law.
      </div>

      <Section num="1" title="Introduction and Scope">
        <p>
          This SLA describes the availability commitment that Blackwellen Ltd (Company No. 16482166) trading as Propvora, registered office 61 Bridge Street, Kington, England, HR5 3DJ (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) makes to customers who subscribe to a paid Propvora plan (&ldquo;you&rdquo;, the &ldquo;Customer&rdquo;).
        </p>
        <p>
          This SLA forms part of, and is incorporated into, the Propvora Terms of Service. In the event of any conflict between this SLA and the Terms of Service in relation to availability and Service Credits, this SLA prevails. Capitalised terms not defined here have the meaning given to them in the Terms of Service.
        </p>
        <p>
          The commitment in this SLA applies to the core Propvora platform &mdash; the hosted web application and its primary operational features &mdash; as made available to paid subscribers. It does not apply to free trials, free or evaluation accounts, sandbox or demo environments, or to any feature that is labelled as beta, preview, early access, or experimental. Such features are provided on an &ldquo;as available&rdquo; basis without any availability commitment.
        </p>
        <p>
          This SLA does not create any commitment regarding the performance, availability, or behaviour of third-party services that you choose to connect to Propvora, nor of the underlying infrastructure providers on which Propvora depends, except as expressly stated.
        </p>
      </Section>

      <Section num="2" title="Definitions">
        <p>In this SLA:</p>
        <ul>
          <li><strong>Uptime</strong> means the periods during a calendar month in which the core Propvora platform is available and responding to authenticated requests as intended.</li>
          <li><strong>Downtime</strong> means any period during which the core Propvora platform is not available to you due to a fault within our reasonable control, excluding any Excluded Downtime. Downtime is measured in whole minutes based on our monitoring systems.</li>
          <li><strong>Monthly Uptime Percentage</strong> means the percentage of available minutes in a calendar month during which the core Propvora platform was up, calculated using the formula in section 3.</li>
          <li><strong>Scheduled Maintenance</strong> means planned maintenance, upgrades, or other work that we carry out on the Service and for which we provide advance notice in accordance with section 4.</li>
          <li><strong>Service Credit</strong> means a credit, expressed as a percentage of the relevant month&rsquo;s subscription fee, applied against a future invoice in accordance with section 6, which is your sole and exclusive remedy for a failure to meet the availability commitment.</li>
          <li><strong>Excluded Downtime</strong> means any period of unavailability that is excluded from the Downtime calculation under section 5, including Scheduled Maintenance and factors outside our reasonable control.</li>
        </ul>
      </Section>

      <Section num="3" title="Availability Commitment">
        <p>
          We aim to make the core Propvora platform available to paid subscribers with a target <strong>Monthly Uptime Percentage of 99.5%</strong>, measured per calendar month.
        </p>
        <p>
          The Monthly Uptime Percentage for a given calendar month is calculated as follows:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Element</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Total Minutes", "The total number of minutes in the calendar month."],
                ["Excluded", "Minutes attributable to Excluded Downtime (including Scheduled Maintenance) during the month."],
                ["Downtime", "Minutes of Downtime during the month, as recorded by our monitoring systems."],
                ["Formula", "(Total Minutes − Excluded − Downtime) ÷ (Total Minutes − Excluded) × 100"],
              ].map(([element, description]) => (
                <tr key={element} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{element}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          In other words, Excluded Downtime is removed from both the numerator and the denominator, so it neither counts against us nor inflates the result. The resulting percentage is rounded to two decimal places. Our monitoring systems are the authoritative source for determining Uptime, Downtime, and the resulting Monthly Uptime Percentage.
        </p>
      </Section>

      <Section num="4" title="Scheduled Maintenance">
        <p>
          From time to time we need to perform maintenance, upgrades, migrations, and other work that may make the Service temporarily unavailable or degraded. Where we plan such work in advance:
        </p>
        <ul>
          <li>We aim to give you at least <strong>48 hours&rsquo; notice</strong> of planned Scheduled Maintenance, by in-app notice, email, or our status communications.</li>
          <li>We aim to carry out Scheduled Maintenance during low-traffic windows (for example, evenings or weekends in UK time) where reasonably possible, to minimise disruption.</li>
          <li>We will endeavour to keep the duration of Scheduled Maintenance as short as reasonably practicable.</li>
        </ul>
        <p>
          Scheduled Maintenance is treated as Excluded Downtime and is not counted as Downtime for the purposes of calculating the Monthly Uptime Percentage. In rare cases we may need to carry out urgent or emergency maintenance to protect the security, integrity, or stability of the Service; we will give as much notice as is reasonably practicable in the circumstances, and such maintenance is also treated as Excluded Downtime.
        </p>
      </Section>

      <Section num="5" title="Exclusions">
        <p>
          The following periods of unavailability or degradation are treated as <strong>Excluded Downtime</strong> and do not count as Downtime for the purposes of this SLA. They are factors outside our reasonable control, or are otherwise outside the scope of the availability commitment:
        </p>
        <ul>
          <li><strong>Third-party provider outages:</strong> failures, outages, throttling, or degradation of upstream infrastructure and service providers on which Propvora depends, including (without limitation) Supabase, Vercel, Cloudflare, and Stripe.</li>
          <li><strong>Internet and network factors:</strong> failures of the public internet, DNS, routing, or telecommunications networks outside our infrastructure, and force majeure events as described in the Terms of Service.</li>
          <li><strong>Customer-side issues:</strong> problems arising from your equipment, software, browsers, configuration, local network, or connectivity, or from your acts or omissions or those of your users.</li>
          <li><strong>Suspension:</strong> any suspension or restriction of your access resulting from your breach of the Terms of Service, non-payment, or in accordance with our acceptable use or security policies.</li>
          <li><strong>Beta and experimental features:</strong> unavailability or faults in any feature labelled as beta, preview, early access, or experimental, which carry no availability commitment.</li>
          <li><strong>Scheduled Maintenance:</strong> any Scheduled Maintenance or emergency maintenance carried out in accordance with section 4.</li>
        </ul>
        <p>
          We are not responsible for any unavailability or loss arising from any of the above, and such periods are excluded from the Downtime and Monthly Uptime Percentage calculations.
        </p>
      </Section>

      <Section num="6" title="Service Credits">
        <p>
          If the Monthly Uptime Percentage for the core Propvora platform falls below the 99.5% target in a given calendar month, you may claim a Service Credit in accordance with section 7. Service Credits are calculated as a percentage of the subscription fee paid for the affected paid plan for the month in question, as set out below:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Monthly Uptime Percentage</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Service Credit (% of that month&rsquo;s fee)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["99.0% to less than 99.5%", "5%"],
                ["95.0% to less than 99.0%", "10%"],
                ["Less than 95.0%", "25%"],
              ].map(([range, credit]) => (
                <tr key={range} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{range}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Service Credits are subject to the following conditions:
        </p>
        <ul>
          <li>Service Credits are applied against a future invoice for your subscription and have no cash value; they are not refundable or exchangeable for money.</li>
          <li>The total Service Credit for any single calendar month is capped at 100% of that month&rsquo;s subscription fee for the affected plan.</li>
          <li>Service Credits are calculated solely by reference to the recurring subscription fee. They exclude one-off charges, add-on charges, usage-based charges, overage charges, taxes, and any amounts payable to third parties.</li>
          <li>Service Credits are only available to accounts in good standing, with no overdue amounts outstanding at the time the credit is requested or applied.</li>
        </ul>
        <p>
          Service Credits are your <strong>sole and exclusive remedy</strong> for any failure by us to meet the availability commitment in this SLA. This does not limit any of your rights that cannot be excluded or limited under applicable law.
        </p>
      </Section>

      <Section num="7" title="Claiming a Service Credit">
        <p>
          To claim a Service Credit, you must submit a request that:
        </p>
        <ul>
          <li>is sent by email to <a href="mailto:support@propvora.com">support@propvora.com</a> within <strong>30 days</strong> of the end of the incident or month giving rise to the claim;</li>
          <li>identifies the workspace and subscription affected;</li>
          <li>describes the incident with reasonable detail, including the dates, times, and duration during which you experienced unavailability, together with any logs, screenshots, or error messages that support the claim.</li>
        </ul>
        <p>
          On receiving a valid claim, we will verify it against our monitoring records. If our records confirm that the Monthly Uptime Percentage fell below the target after excluding Excluded Downtime, we will apply the corresponding Service Credit to a future invoice. If you do not submit a claim within the 30-day window, or your account is not in good standing, you forfeit your right to a Service Credit for that incident or month.
        </p>
      </Section>

      <Section num="8" title="Support Response Targets">
        <p>
          We aim to respond to support requests within the target first-response times set out below, based on the severity of the issue. These are targets for our first substantive response, not resolution times, and they apply during UK business hours.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Severity</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Description</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Target first response</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Critical", "Total outage — the core platform is unavailable or unusable for the workspace.", "4 business hours"],
                ["High", "A major feature is unavailable or significantly impaired, with no reasonable workaround.", "1 business day"],
                ["Normal", "A minor issue, question, or request that does not prevent core use of the platform.", "2 business days"],
              ].map(([severity, description, target]) => (
                <tr key={severity} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{severity}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{description}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Support is provided during UK business hours, Monday to Friday, excluding public and bank holidays in England and Wales. Requests received outside these hours are treated as received at the start of the next business day. We will assess and assign the severity of each request acting reasonably and in good faith.
        </p>
      </Section>

      <Section num="9" title="Status and Incident Communication">
        <p>
          During an incident affecting availability, we aim to keep you informed through one or more of the following channels: an in-app notice, email to the address on your account, and any status page or status communications we operate from time to time.
        </p>
        <p>
          Our platform is monitored using error-tracking and observability tooling, backed by Sentry, which helps us detect, diagnose, and respond to incidents promptly. We will use reasonable efforts to communicate the nature of a significant incident, its impact, and the expected path to resolution, and to confirm when the incident has been resolved.
        </p>
      </Section>

      <Section num="10" title="Changes to this SLA">
        <p>
          We may update this SLA from time to time to reflect changes in our infrastructure, processes, or service offering. Where we make a material reduction to the availability commitment or the Service Credit entitlements in this SLA, we will give you advance notice by in-app notice or email before the change takes effect. Your continued use of the Service after the change takes effect constitutes acceptance of the updated SLA. Non-material changes and clarifications take effect when published.
        </p>
      </Section>

      <Section num="11" title="Contact">
        <p>
          For SLA enquiries, Service Credit claims, and support requests, contact us at <a href="mailto:support@propvora.com">support@propvora.com</a>.
        </p>
        <p>
          Blackwellen Ltd (Company No. 16482166) trading as Propvora, registered office 61 Bridge Street, Kington, England, HR5 3DJ. This SLA is governed by the laws of England and Wales.
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
