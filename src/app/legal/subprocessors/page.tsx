import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Sub-processors | Propvora",
  description: "The authoritative list of sub-processors engaged by Blackwellen Ltd (trading as Propvora) to deliver the Service, including the data processed, processing location, and the transfer safeguards relied upon.",
}

export default function SubprocessorsPage() {
  return (
    <LegalLayout title="Sub-processors" lastUpdated="29 June 2026">
      <Section num="1" title="Introduction">
        <p>
          A &ldquo;sub-processor&rdquo; is a third party engaged by Blackwellen Ltd (Company No. 16482166), trading as Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), to process personal data on our behalf in the course of delivering the Propvora platform (the &ldquo;Service&rdquo;). Where Propvora acts as a processor on behalf of a business customer (the &ldquo;Controller&rdquo;), these sub-processors act as our onward processors, processing the Controller&rsquo;s personal data strictly in accordance with our documented instructions and the safeguards set out below.
        </p>
        <p>
          By accepting the Propvora Data Processing Agreement (&ldquo;DPA&rdquo;), the Controller grants Propvora a general written authorisation to engage the sub-processors listed in section 2 of this page. This page is the authoritative, granular register of those sub-processors and is incorporated by reference into the DPA and the Privacy Policy. Each sub-processor is bound by a written contract that imposes data-protection obligations no less protective than those in our DPA, including obligations of confidentiality, security, and assistance with data subject rights.
        </p>
        <p>
          We give the Controller at least 30 days&rsquo; advance notice of any intended addition to, or replacement of, a sub-processor, providing an opportunity to object on reasonable data-protection grounds before the new sub-processor begins processing, as set out in section 4.
        </p>
      </Section>

      <Section num="2" title="Current Sub-processors">
        <p>
          The following sub-processors are currently engaged by Propvora to deliver the Service. The table records, for each sub-processor, the service it provides, the categories of data it processes, the principal location of processing, and the safeguard or transfer mechanism we rely upon where personal data leaves the United Kingdom or the European Economic Area.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Sub-processor</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Service provided</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Data processed</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Processing location</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Safeguard / transfer mechanism</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase Inc.", "Managed Postgres database, authentication, file storage", "Workspace records, account data, uploaded documents", "EU (AWS, Frankfurt)", "UK GDPR adequacy / EU hosting"],
                ["Vercel Inc.", "Application hosting & serverless compute", "Request data, logs", "USA / EU edge", "UK SCCs + IDTA"],
                ["Cloudflare Inc.", "CDN, DDoS/WAF security, R2 object storage", "Traffic metadata, cached assets, stored files", "Global (EU residency options)", "UK SCCs + IDTA"],
                ["Stripe Inc. (incl. Stripe Payments UK Ltd)", "Payment & subscription processing, Connect payouts", "Billing contact, card tokens (Stripe-held), payout details", "UK / USA / EU", "UK SCCs; Stripe is an independent controller for payment data"],
                ["Resend Inc.", "Transactional & notification email delivery", "Recipient email, message content", "USA", "UK SCCs + IDTA"],
                ["Microsoft Azure (Azure OpenAI, EU)", "Primary AI Copilot language-model processing", "Prompt context (workspace summaries), no training use", "EU (Azure EU region)", "Microsoft DPA + EU Data Boundary"],
                ["Anthropic, PBC", "AI model processing (premium tier)", "Prompt context", "USA", "UK SCCs + IDTA, zero-retention / no-training terms"],
                ["Google (Gemini)", "AI model processing (optional tier)", "Prompt context", "USA / EU", "UK SCCs + IDTA"],
                ["NVIDIA Corporation (NIM)", "AI inference (fallback, US-hosted open models)", "Prompt context", "USA", "UK SCCs + IDTA"],
                ["Sentry (Functional Software, Inc.)", "Error monitoring", "Error metadata, request IDs (no raw PII payloads)", "EU (Germany region)", "EU hosting"],
              ].map(([name, service, data, location, mechanism]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{service}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{data}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{location}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The categories of data above describe the data each sub-processor is permitted to process in order to perform its function. Our AI sub-processors receive only the prompt context necessary to generate a response &mdash; typically condensed workspace summaries rather than raw record sets &mdash; and are contractually prohibited from using Controller data to train or improve their models. Sentry and equivalent observability tooling are configured to scrub raw personal-data payloads, retaining only the technical metadata required to diagnose faults.
        </p>
      </Section>

      <Section num="3" title="International Data Transfers">
        <p>
          Propvora is established in England and Wales, and our preference is to keep personal data within the United Kingdom or the European Economic Area wherever the Service permits. Several of the sub-processors listed above are headquartered outside the UK/EEA, and a subset of processing may therefore involve a restricted transfer of personal data.
        </p>
        <p>
          Where personal data is transferred to a country that has not been the subject of a UK adequacy regulation, we put in place an appropriate transfer mechanism before any such transfer takes place. In practice this means the UK International Data Transfer Agreement (&ldquo;IDTA&rdquo;) or the UK Addendum to the European Commission&rsquo;s Standard Contractual Clauses (&ldquo;SCCs&rdquo;), supplemented where appropriate by a transfer risk assessment and additional technical and organisational measures &mdash; including encryption in transit and at rest, and access controls &mdash; to ensure that data subjects continue to enjoy a level of protection essentially equivalent to that guaranteed under UK GDPR.
        </p>
        <p>
          Where a sub-processor offers EU or UK data residency, we configure the Service to use that residency option so that the volume of restricted transfers is minimised.
        </p>
      </Section>

      <Section num="4" title="Changes to This List">
        <p>
          We keep this list current and will notify the Controller of any intended change &mdash; whether the addition of a new sub-processor or the replacement of an existing one &mdash; at least 30 days before that sub-processor begins processing the Controller&rsquo;s personal data. Notice is given through the in-app notification system and, where the Controller has subscribed to sub-processor updates, by email to the address on the account.
        </p>
        <p>
          The Controller may object to a proposed change on reasonable data-protection grounds by writing to <a href="mailto:legal@propvora.com">legal@propvora.com</a> within the notice period. Where the Controller raises a reasonable objection, we will use commercially reasonable efforts to make available an alternative arrangement that avoids the use of the objected-to sub-processor. If we are unable to offer such an alternative within a reasonable period, the Controller may, as its sole and exclusive remedy, terminate the affected portion of the Service in accordance with the termination provisions of the Terms of Service, without penalty for that termination.
        </p>
      </Section>

      <Section num="5" title="Controller-of-record Note">
        <p>
          For certain categories of payment and transaction data, Stripe acts as an independent controller rather than as our sub-processor. This reflects Stripe&rsquo;s own legal and regulatory obligations &mdash; including anti-money-laundering, fraud prevention, and financial-services compliance &mdash; in respect of the payment data it handles.
        </p>
        <p>
          For that data, Stripe determines the purposes and means of processing in its own right and is responsible as a controller under applicable data protection law. Stripe&rsquo;s processing of such data is governed by Stripe&rsquo;s own privacy notice and terms. Propvora does not store full card numbers; card details are tokenised and held by Stripe.
        </p>
      </Section>

      <Section num="6" title="Contact">
        <p>
          For any questions about our sub-processors, to request inclusion on our sub-processor change notification list, or to raise an objection under section 4, please contact us at <a href="mailto:legal@propvora.com">legal@propvora.com</a>.
        </p>
        <p>
          Blackwellen Ltd (Company No. 16482166) trading as Propvora, registered office 61 Bridge Street, Kington, England, HR5 3DJ. ICO registration ZC160806. Governed by the laws of England and Wales.
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
