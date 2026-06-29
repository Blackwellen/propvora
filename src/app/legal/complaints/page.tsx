import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Complaints Procedure | Propvora",
  description: "Propvora Complaints Handling Procedure — how to raise a complaint, our staged process and timescales, and your external escalation routes.",
}

export default function ComplaintsPage() {
  return (
    <LegalLayout title="Complaints Procedure" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This Complaints Handling Procedure explains how Blackwellen Ltd (Company No. 16482166) trading as Propvora handles complaints about its software, billing, data handling, and marketplace facilitation. If something has gone wrong, we want to hear about it &mdash; telling us is the quickest way to get it put right.
      </div>

      <Section num="1" title="Our Commitment">
        <p>
          We take every complaint seriously. We are committed to handling complaints fairly, promptly, and transparently, and to learning from them so that we can keep improving the Propvora Service.
        </p>
        <p>
          When you raise a concern, you can expect us to:
        </p>
        <ul>
          <li>Treat you with courtesy and respect, and listen to what you tell us</li>
          <li>Acknowledge your complaint quickly and keep you informed of progress</li>
          <li>Investigate the issues you raise thoroughly and objectively</li>
          <li>Explain our findings and the reasons for any decision in plain English</li>
          <li>Put things right where we have got something wrong, and tell you what we have changed</li>
          <li>Handle your complaint without any detriment to your continued use of the Service</li>
        </ul>
        <p>
          A complaint is any expression of dissatisfaction, whether justified or not, about the standard of service, actions, or lack of action by Propvora or its staff. You do not need to use the word &ldquo;complaint&rdquo; for us to treat your concern as one.
        </p>
      </Section>

      <Section num="2" title="What This Procedure Covers">
        <p>
          This procedure applies to complaints about Propvora and the services we provide directly, including:
        </p>
        <ul>
          <li><strong>Service issues:</strong> faults, outages, errors, data accuracy, or the quality and usability of the Propvora platform</li>
          <li><strong>Billing and subscriptions:</strong> charges, plan changes, add-ons, credits, refunds, or invoicing queries</li>
          <li><strong>Data protection:</strong> how we collect, store, use, share, or secure your personal data</li>
          <li><strong>Marketplace and supplier disputes:</strong> concerns about how the marketplace functions, listings, reviews, or our facilitation of connections between users</li>
          <li><strong>Conduct:</strong> the behaviour, professionalism, or responsiveness of our staff or support team</li>
        </ul>
        <h3>Matters handled through separate routes</h3>
        <p>
          Some issues have dedicated channels in addition to (or instead of) this procedure:
        </p>
        <ul>
          <li><strong>Data protection complaints</strong> can also be raised directly with the Information Commissioner&rsquo;s Office (ICO), the UK&rsquo;s independent data protection regulator. You do not have to complain to us first, although we would welcome the chance to resolve matters for you. See section 5.</li>
          <li><strong>Payment disputes</strong> (for example, a charge you believe is incorrect) can often be raised most quickly through your bank or card issuer, or through our payment processor, Stripe. See section 5.</li>
          <li><strong>Marketplace transactions</strong> are agreements between users. Propvora acts as a facilitator and is not a party to the underlying contract for goods or services. A dispute about the work, payment, or conduct of another user is, in the first instance, a matter between the users involved &mdash; though we will assist where our platform or facilitation is part of the problem.</li>
        </ul>
      </Section>

      <Section num="3" title="How to Make a Complaint">
        <p>
          The easiest way to raise a complaint is by email to <a href="mailto:support@propvora.com">support@propvora.com</a>, or through the in-app support option in your Propvora workspace. There is no charge for making a complaint.
        </p>
        <p>
          To help us investigate quickly and give you a meaningful response, please include as much of the following as you can:
        </p>
        <ul>
          <li>Your name and the account or workspace your complaint relates to</li>
          <li>A clear description of what happened, and what went wrong</li>
          <li>The relevant dates and times, and any reference numbers, invoice numbers, or screenshots</li>
          <li>The names of anyone you have already dealt with, if relevant</li>
          <li>What you would like us to do to put things right (the resolution you are seeking)</li>
        </ul>
        <p>
          If you need help putting your complaint in writing, or you would prefer to raise it another way, please let us know and we will make reasonable adjustments to support you (see section 6).
        </p>
      </Section>

      <Section num="4" title="Our Process and Timescales">
        <p>
          We follow a clear, staged procedure so that you always know what happens next and by when. Working days mean Monday to Friday, excluding public holidays in England and Wales.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Stage</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">What happens</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Timescale</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "1. Acknowledgement",
                  "We confirm we have received your complaint, give you a reference, and tell you who is handling it.",
                  "Within 2 working days",
                ],
                [
                  "2. Investigation & initial response",
                  "We look into the issues you have raised, gather the relevant records, and send you a written response setting out our findings. If we need longer than usual, we will tell you why and give you a date by which you can expect a full response.",
                  "Within 10 working days",
                ],
                [
                  "3. Escalation / review",
                  "If you are not satisfied with our initial response, you can ask for the matter to be reviewed by a senior member of the team who was not involved in the original handling. They will reconsider the complaint afresh.",
                  "Within a further 15 working days",
                ],
                [
                  "4. Final response",
                  "We issue a written final response that sets out our conclusions, the reasons for them, any action we are taking, and your options if you remain dissatisfied.",
                  "On completion of the review",
                ],
              ].map(([stage, detail, timescale]) => (
                <tr key={stage} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium align-top">{stage}</td>
                  <td className="p-3 border border-slate-200 text-slate-600 align-top">{detail}</td>
                  <td className="p-3 border border-slate-200 text-slate-600 align-top">{timescale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We aim to resolve most complaints well within these timescales, and often much sooner. If your complaint is complex, or if we need information from a third party, we may need more time &mdash; if so, we will always explain the reason and give you a clear date for our next update. We will keep you informed at each stage rather than leaving you to chase us.
        </p>
      </Section>

      <Section num="5" title="If You Remain Dissatisfied">
        <p>
          We would always like the opportunity to put things right ourselves. However, if you have been through our procedure and remain dissatisfied, there are independent routes available to you depending on the nature of your complaint. You are also free to seek independent legal advice at any stage.
        </p>
        <h3>Data protection complaints &mdash; the ICO</h3>
        <p>
          If your complaint concerns how we handle your personal data and you are not happy with our response, you have the right to complain to the Information Commissioner&rsquo;s Office (ICO), the UK&rsquo;s independent regulator for data protection:
        </p>
        <ul>
          <li>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
          <li>Helpline: 0303 123 1113</li>
          <li>Post: Information Commissioner&rsquo;s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</li>
        </ul>
        <h3>Payment and billing disputes</h3>
        <p>
          If your complaint relates to a payment or charge, you may also be able to raise it directly with:
        </p>
        <ul>
          <li>Your card issuer or bank, who may be able to assist with a chargeback or dispute</li>
          <li>Stripe, our payment processor, where the issue relates to payment processing itself</li>
        </ul>
        <h3>Consumer rights</h3>
        <p>
          If you are a consumer, you can obtain free, impartial advice about your rights from the Citizens Advice consumer helpline, which can also refer matters to Trading Standards where appropriate. Details are available at <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer">citizensadvice.org.uk</a>.
        </p>
        <h3>Marketplace transactions</h3>
        <p>
          Please remember that marketplace transactions are agreements between users. Propvora is a facilitator and is not a party to those agreements. Where a dispute is genuinely between you and another user, the most effective route is usually to resolve it directly with the other party, using any evidence available within the platform. We will assist where our facilitation, tools, or handling form part of the complaint.
        </p>
      </Section>

      <Section num="6" title="Vulnerable Customers and Reasonable Adjustments">
        <p>
          We recognise that some people may need extra support to make a complaint or to follow our process &mdash; for example, because of a disability, health condition, language need, or difficult personal circumstances.
        </p>
        <p>
          If this applies to you, please tell us how we can help and we will make reasonable adjustments, such as communicating in a different format, allowing more time to respond, or arranging an alternative way to share information with us. You can read more about how we support accessibility in our <a href="/legal/accessibility">Accessibility Statement</a>.
        </p>
      </Section>

      <Section num="7" title="Records and Continuous Improvement">
        <p>
          We keep a record of the complaints we receive and how we resolve them. We use this information to identify patterns, fix underlying problems, and improve the Service for everyone.
        </p>
        <p>
          Complaint records may contain personal data. We handle that data in line with our <a href="/legal/privacy">Privacy Policy</a>, retain it only for as long as necessary, and protect it with the same security measures that apply across the platform.
        </p>
      </Section>

      <Section num="8" title="Contact">
        <p>
          To make a complaint, or to ask about the status of an existing complaint, please contact us:
        </p>
        <ul>
          <li><strong>Complaints:</strong> <a href="mailto:support@propvora.com">support@propvora.com</a></li>
          <li><strong>Legal and data protection:</strong> <a href="mailto:legal@propvora.com">legal@propvora.com</a></li>
          <li><strong>General enquiries:</strong> <a href="mailto:info@propvora.com">info@propvora.com</a></li>
        </ul>
        <p>
          Blackwellen Ltd (Company No. 16482166) trading as Propvora. Registered office: 61 Bridge Street, Kington, England, HR5 3DJ. ICO registration: ZC160806.
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
