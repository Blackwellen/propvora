import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Data Retention & Deletion | Propvora",
  description: "Propvora Data Retention & Deletion Policy — how long we keep personal data, our retention schedule, account closure, erasure requests, and how deletion works.",
}

export default function DataRetentionPage() {
  return (
    <LegalLayout title="Data Retention & Deletion Policy" lastUpdated="29 June 2026">
      <Section num="1" title="Purpose and Scope">
        <p>
          This Data Retention &amp; Deletion Policy explains how long Blackwellen Ltd (Company No. 16482166) trading as Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) keeps the personal data we hold, and how and when we delete it. Our registered office is at 61 Bridge Street, Kington, England, HR5 3DJ, and we are registered with the Information Commissioner&rsquo;s Office (ICO) under registration number ZC160806.
        </p>
        <p>
          This policy applies to all personal data processed through the Propvora platform (the &ldquo;Service&rdquo;), whether we process it as a controller in our own right (for example, account and billing data) or as a processor on behalf of our business customers (for example, the tenant, landlord, and supplier data stored within a customer workspace).
        </p>
        <p>
          This policy should be read together with our <a href="/legal/privacy">Privacy Policy</a>, which describes what personal data we collect and why, and our <a href="/legal/data-processing">Data Processing Agreement</a>, which governs the controller and processor relationship for business customers. Where there is any inconsistency between this policy and a signed agreement with a business customer, the terms of the signed agreement prevail to the extent of that inconsistency.
        </p>
      </Section>

      <Section num="2" title="Our Retention Principles">
        <p>
          The UK General Data Protection Regulation (UK GDPR) sets out a &ldquo;storage limitation&rdquo; principle at Article 5(1)(e): personal data must be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which it is processed. We take this principle seriously and apply the following standards across the Service:
        </p>
        <ul>
          <li>We keep personal data only for as long as it is reasonably necessary to fulfil the purposes for which it was collected, including providing the Service to our customers.</li>
          <li>Where the law requires us to retain certain records for a defined period (for example, tax, accounting, or anti-money-laundering obligations), we keep that data for the period required and no longer than necessary thereafter.</li>
          <li>We set defined retention periods for each category of personal data, as described in the retention schedule below, and we review these periods periodically.</li>
          <li>When a retention period ends, or when personal data is no longer needed, we delete it, anonymise it, or securely destroy it in accordance with this policy.</li>
          <li>We do not keep personal data &ldquo;just in case&rdquo; it might be useful in the future. Retention must always be justified by a current purpose or a legal obligation.</li>
        </ul>
        <p>
          Retention periods are guidelines that reflect the maximum period for which we ordinarily hold each category of data. Where data is no longer needed before the stated period elapses, we may delete it sooner.
        </p>
      </Section>

      <Section num="3" title="Retention Schedule">
        <p>
          The table below sets out the categories of personal data we hold, how long we ordinarily retain each category, and the rationale for that retention period. Where a category is held within a customer workspace, the business customer (as controller) may set shorter retention practices through their own use of the Service.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Data category</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Retention period</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Active workspace data (properties, tenancies, contacts, documents)", "For the life of the account", "Needed to provide the Service to the customer for as long as their account is active"],
                ["Account and profile data", "Life of account + up to 30 days after closure", "Supports a wind-down and data export window before permanent deletion"],
                ["Billing and invoice records", "7 years", "Required by UK tax and accounting law (HMRC record-keeping rules and the Companies Act 2006)"],
                ["Support and complaint correspondence", "Up to 3 years", "Service quality, training, and the handling of disputes or complaints"],
                ["Security and audit logs", "12 months (extendable while an investigation is active)", "Security monitoring, abuse prevention, and the protection of legal rights"],
                ["Marketing contacts and consent records", "Until consent is withdrawn + 2 years proof of consent", "Compliance with PECR and the UK GDPR accountability principle"],
                ["AI usage and audit logs", "Up to 24 months", "Usage metering, billing accuracy, and abuse prevention"],
                ["Backups", "Rolling 30-day cycle", "Disaster recovery; deleted data persists in backups until the cycle completes"],
              ].map(([category, period, rationale]) => (
                <tr key={category} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{category}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{period}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The periods above may be extended in specific circumstances where we are required to retain data to establish, exercise, or defend legal claims, to comply with a court order or a regulator&rsquo;s request, or to fulfil a continuing legal obligation. Where this happens, we ring-fence the data so that it is used only for that purpose and is deleted once the purpose has been satisfied.
        </p>
      </Section>

      <Section num="4" title="Account Closure and Deletion">
        <p>
          When a customer closes their account, or when their subscription ends and is not renewed, we begin a structured wind-down of their workspace data:
        </p>
        <ul>
          <li><strong>Export window:</strong> We provide a 30-day window from the date of closure during which the customer can log in to export their workspace data using the in-app export tools. We recommend customers export everything they wish to keep before this window closes.</li>
          <li><strong>Permanent deletion:</strong> After the 30-day export window ends, we permanently delete the personal data held within the closed workspace from our live production systems.</li>
          <li><strong>Backups:</strong> Copies of deleted data may persist in our encrypted backups until the rolling 30-day backup cycle completes, after which those copies are purged. Backups are never used to restore deleted accounts and are accessible only for disaster-recovery purposes.</li>
          <li><strong>Sub-processors:</strong> We instruct our sub-processors (as listed in our <a href="/legal/data-processing">Data Processing Agreement</a>) to delete the relevant personal data in accordance with their own deletion timelines.</li>
          <li><strong>Retained records:</strong> We retain billing and invoice records, and any data we are otherwise legally required to keep, for the periods set out in the retention schedule above, even after the workspace itself has been deleted.</li>
        </ul>
        <p>
          Closing an account is an irreversible action once the export window has elapsed. We will confirm closure by email to the address held on the account.
        </p>
      </Section>

      <Section num="5" title="Data Subject Deletion Requests and the Right to Erasure">
        <p>
          Individuals have the right under the UK GDPR to request the erasure of their personal data in certain circumstances (the &ldquo;right to be forgotten&rdquo;). How such a request is handled depends on whether Propvora holds the data as a controller or as a processor on behalf of a business customer.
        </p>
        <h3>Where a business customer is the controller</h3>
        <p>
          For personal data stored inside a customer workspace (for example, a tenant&rsquo;s contact details), the business customer is the data controller and is responsible for responding to erasure requests from the individuals whose data they hold. The Service provides in-app tools that allow customers to find, edit, redact, and delete records relating to a data subject so they can give effect to a valid erasure request. If an individual contacts us directly about workspace data, we will, where appropriate, forward the request to the relevant controller and assist them in responding.
        </p>
        <h3>Where Propvora is the controller</h3>
        <p>
          For personal data we hold as a controller in our own right (such as the account holder&rsquo;s own profile and login data), an individual can ask us to erase their data by emailing <a href="mailto:legal@propvora.com">legal@propvora.com</a>. We will verify the identity of the requester before acting and will respond within one calendar month, as required by the UK GDPR (extendable by up to two further months for complex requests, in which case we will tell the requester within the first month).
        </p>
        <h3>When we may decline or limit an erasure request</h3>
        <p>
          The right to erasure is not absolute. We may retain personal data, in whole or in part, where we have a lawful basis or an overriding obligation to do so, including where the data is needed:
        </p>
        <ul>
          <li>to comply with a legal obligation, such as tax, accounting, or anti-money-laundering record-keeping;</li>
          <li>to establish, exercise, or defend legal claims;</li>
          <li>for reasons of public interest or for the exercise of official authority; or</li>
          <li>where deletion would prevent us from fulfilling a contract that is still in force.</li>
        </ul>
        <p>
          Where we cannot fully erase data, we will explain why, and we will restrict our processing of that data to the permitted purpose only.
        </p>
      </Section>

      <Section num="6" title="Anonymisation">
        <p>
          In some cases we transform personal data into aggregated or anonymised data that no longer identifies any individual, whether directly or indirectly. Once data has been genuinely and irreversibly anonymised, it falls outside the scope of the UK GDPR because it is no longer personal data.
        </p>
        <p>
          We may retain such aggregated and anonymised data indefinitely for purposes including statistical analysis, benchmarking, service performance monitoring, and product improvement. For example, we may keep anonymised metrics about how features of the Service are used. We will not attempt to re-identify individuals from anonymised datasets, and we apply appropriate techniques to ensure that re-identification is not reasonably possible.
        </p>
      </Section>

      <Section num="7" title="Controller and Processor Responsibilities">
        <p>
          For workspace data, the business customer is the data controller and determines the purposes and means of processing, including the practical retention of records through their day-to-day use of the Service. The customer sets retention in practice by choosing what to store, what to archive, and what to delete.
        </p>
        <p>
          Propvora acts as the data processor for that workspace data. We retain and delete workspace data in accordance with the customer&rsquo;s documented instructions (which include their use of the Service&rsquo;s features) and the terms of this policy and our <a href="/legal/data-processing">Data Processing Agreement</a>. We will not retain workspace personal data for longer than the customer requires, except where we are legally obliged to do so or where the data persists temporarily in backups as described above.
        </p>
        <p>
          Where Propvora processes personal data for its own purposes &mdash; such as managing accounts, processing payments, providing support, and securing the platform &mdash; we act as a controller and apply the retention periods set out in the schedule in section 3.
        </p>
      </Section>

      <Section num="8" title="How Deletion Works Technically">
        <p>
          Deletion within the Service is implemented in stages so that accidental loss can be prevented while still honouring our retention commitments:
        </p>
        <ul>
          <li><strong>Soft delete:</strong> When a record is first deleted, it is typically marked as deleted and removed from the user&rsquo;s view. During this stage the record can, where the feature allows, be restored by an authorised user. Soft-deleted data is no longer used for active processing.</li>
          <li><strong>Hard delete:</strong> After the applicable grace or retention period, soft-deleted records are permanently removed from our live production databases and storage so that they can no longer be retrieved through the Service.</li>
          <li><strong>Backup expiry:</strong> Copies of deleted data may remain in our encrypted, access-controlled backups until the rolling 30-day backup cycle completes, at which point those copies expire and are purged. Backups are isolated from live systems and are used only for disaster recovery.</li>
          <li><strong>Sub-processor deletion:</strong> Where data is held by a sub-processor, we issue deletion instructions and rely on the sub-processor&rsquo;s contractual deletion commitments to complete the removal.</li>
          <li><strong>Certification of deletion:</strong> On reasonable written request, we can provide written confirmation that personal data has been deleted in accordance with this policy.</li>
        </ul>
        <p>
          We apply appropriate technical and organisational measures to ensure that deletion is carried out securely and that deleted personal data cannot be reconstructed once the relevant periods have elapsed.
        </p>
      </Section>

      <Section num="9" title="Contact">
        <p>
          For questions about this policy, to make an erasure request, or to request certification of deletion, please contact our data team at <a href="mailto:legal@propvora.com">legal@propvora.com</a>. For general assistance, you can reach our support team at <a href="mailto:support@propvora.com">support@propvora.com</a>.
        </p>
        <p>
          Blackwellen Ltd trading as Propvora, 61 Bridge Street, Kington, England, HR5 3DJ. If you are not satisfied with how we have handled your personal data, you have the right to lodge a complaint with the Information Commissioner&rsquo;s Office (ICO) at <a href="https://ico.org.uk">ico.org.uk</a>.
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
