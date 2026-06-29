import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Data Processing Agreement | Propvora",
  description: "Propvora Data Processing Agreement for business customers — UK GDPR controller/processor roles, sub-processors, international transfers, security, and audit rights.",
}

export default function DataProcessingPage() {
  return (
    <LegalLayout title="Data Processing Agreement" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This Data Processing Agreement (&ldquo;DPA&rdquo;) applies to business customers using Propvora to process personal data on behalf of others (for example, storing and managing tenant personal data). By using the Propvora Service as a business, you agree to the terms of this DPA. This DPA forms part of, and is incorporated into, the Propvora Terms of Service (the &ldquo;Terms&rdquo;). It is entered into between Blackwellen Ltd (Company No. 16482166), trading as Propvora, of 61 Bridge Street, Kington, England, HR5 3DJ (ICO registration ZC160806), and you, the business customer.
      </div>

      <Section num="1" title="Definitions and Interpretation">
        <p>
          In this DPA, the following terms have the meanings set out below. Capitalised terms not defined here have the meaning given to them in the Terms.
        </p>
        <ul>
          <li><strong>Applicable Data Protection Law</strong> means all laws and regulations applicable to the Processing of Personal Data under this DPA, including the UK GDPR, the Data Protection Act 2018, the Privacy and Electronic Communications Regulations 2003 (where relevant), and any successor or amending legislation, together with any binding guidance and codes of practice issued by the Information Commissioner&rsquo;s Office.</li>
          <li><strong>UK GDPR</strong> means Regulation (EU) 2016/679 of the European Parliament and of the Council (the General Data Protection Regulation) as it forms part of the law of England and Wales, Scotland and Northern Ireland by virtue of section 3 of the European Union (Withdrawal) Act 2018, as amended by the Data Protection, Privacy and Electronic Communications (Amendments etc.) (EU Exit) Regulations 2019.</li>
          <li><strong>DPA 2018</strong> means the Data Protection Act 2018.</li>
          <li><strong>Controller</strong> means the natural or legal person which, alone or jointly with others, determines the purposes and means of the Processing of Personal Data. Under this DPA, the Controller is the business customer.</li>
          <li><strong>Processor</strong> means the natural or legal person which Processes Personal Data on behalf of the Controller. Under this DPA, the Processor is Propvora.</li>
          <li><strong>Sub-processor</strong> means any third party engaged by the Processor (or by another Sub-processor) to carry out specific Processing activities on behalf of the Controller.</li>
          <li><strong>Personal Data</strong> means any information relating to an identified or identifiable natural person (a &ldquo;Data Subject&rdquo;) that is Processed by the Processor on behalf of the Controller under this DPA.</li>
          <li><strong>Processing</strong> (and &ldquo;Process&rdquo;, &ldquo;Processes&rdquo; and &ldquo;Processed&rdquo;) means any operation or set of operations performed on Personal Data, whether or not by automated means, including collection, recording, organisation, structuring, storage, adaptation, retrieval, consultation, use, disclosure, restriction, erasure or destruction.</li>
          <li><strong>Data Subject</strong> means the identified or identifiable natural person to whom Personal Data relates.</li>
          <li><strong>Personal Data Breach</strong> means a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, Personal Data transmitted, stored or otherwise Processed.</li>
          <li><strong>Standard Contractual Clauses</strong> or <strong>SCCs</strong> means the standard data protection clauses adopted by the European Commission for the transfer of personal data to processors established in third countries.</li>
          <li><strong>UK IDTA</strong> means the International Data Transfer Agreement issued by the Information Commissioner under section 119A of the DPA 2018, and/or the International Data Transfer Addendum to the EU SCCs (the &ldquo;UK Addendum&rdquo;), as applicable.</li>
          <li><strong>Service</strong> means the Propvora platform and related services provided to the Controller under the Terms.</li>
        </ul>
        <p>
          The words &ldquo;include&rdquo;, &ldquo;includes&rdquo; and &ldquo;including&rdquo; are to be construed without limitation. References to a statute or statutory provision include that provision as amended, extended or re-enacted from time to time.
        </p>
      </Section>

      <Section num="2" title="Parties and Roles">
        <p>
          This DPA is entered into between:
        </p>
        <ul>
          <li><strong>Data Controller:</strong> You, the business customer who determines the purposes and means of Processing Personal Data using the Propvora platform (the &ldquo;Controller&rdquo;).</li>
          <li><strong>Data Processor:</strong> Blackwellen Ltd (Company No. 16482166) trading as Propvora, registered office 61 Bridge Street, Kington, England, HR5 3DJ, which Processes Personal Data on your behalf in order to provide the Service (the &ldquo;Processor&rdquo;).</li>
        </ul>
        <p>
          With respect to the Personal Data that the Controller submits to, or generates within, its workspace, the parties acknowledge and agree that the Controller is the Controller and Propvora is the Processor.
        </p>
        <p>
          Where Propvora Processes Personal Data for its own purposes &mdash; for example, the Controller&rsquo;s own account, authentication, billing, subscription, support and security data, and aggregated or anonymised usage analytics &mdash; Propvora acts as an independent Controller in its own right and not as a Processor. Such Processing is governed by Propvora&rsquo;s <a href="/legal/privacy">Privacy Policy</a> rather than by this DPA.
        </p>
      </Section>

      <Section num="3" title="Subject Matter, Duration, Nature and Purpose of Processing">
        <p>
          This section, together with the Terms, constitutes the Controller&rsquo;s documented instructions to the Processor and describes the Processing for the purposes of Article 28(3) UK GDPR.
        </p>

        <h3>Subject matter</h3>
        <p>
          The Processing of Personal Data submitted to, stored in, or generated within the Controller&rsquo;s Propvora workspace in connection with the provision of the Service.
        </p>

        <h3>Duration</h3>
        <p>
          The duration of the Processing is the term of the Terms (and therefore of this DPA), plus the post-termination period during which Personal Data is retained for export and then deleted in accordance with section 13 (the export window of 30 days, followed by deletion, with residual data in encrypted backups expiring on the backup rotation cycle).
        </p>

        <h3>Nature and purpose of Processing</h3>
        <p>
          Propvora Processes Personal Data on behalf of the Controller for the following purposes:
        </p>
        <ul>
          <li>Storing, retrieving, organising and displaying property, tenancy, contact, compliance, planning and financial data submitted by the Controller</li>
          <li>Providing the full functionality of the Propvora platform as described in the Terms</li>
          <li>Enabling AI Copilot contextual analysis using the workspace data the Controller chooses to make available to it</li>
          <li>Providing document and media storage, retrieval and secure sharing</li>
          <li>Sending transactional, notification and portal communications initiated by the Controller</li>
          <li>Generating reports, exports and analytics from the Controller&rsquo;s workspace data</li>
          <li>Performing backups, maintenance, support and security operations necessary to deliver the Service</li>
        </ul>

        <h3>Categories of Personal Data Processed</h3>
        <ul>
          <li>Tenant and occupant data: name, contact details, tenancy terms, rent and payment history, correspondence, identity and right-to-rent information where the Controller chooses to store it</li>
          <li>Landlord data: name, contact details, property ownership and financial information</li>
          <li>Supplier and contractor data: name, contact details, trade, job and invoice history</li>
          <li>Professional contact data: letting agents, solicitors, accountants and other contacts</li>
          <li>Portal user data: portal account identifiers, access tokens and activity</li>
          <li>Any other Personal Data the Controller chooses to store in or generate within its workspace</li>
        </ul>

        <h3>Categories of Data Subjects</h3>
        <ul>
          <li>Tenants and occupants of managed properties</li>
          <li>Property owners (landlords)</li>
          <li>Contractors, suppliers and service providers</li>
          <li>Letting agents and professional contacts</li>
          <li>Portal users invited by the Controller</li>
          <li>The Controller&rsquo;s own personnel and authorised users</li>
        </ul>

        <h3>Special category data</h3>
        <p>
          The Service is not designed for the Processing of special categories of Personal Data (Article 9 UK GDPR) or data relating to criminal convictions and offences (Article 10). The Controller should not submit such data unless strictly necessary and subject to the safeguards set out in section 5.
        </p>
      </Section>

      <Section num="4" title="Processor Obligations">
        <p>
          In accordance with Article 28(3) UK GDPR, Propvora, as Processor, agrees that it shall:
        </p>
        <ul>
          <li><strong>Documented instructions:</strong> Process the Personal Data only on documented instructions from the Controller, including with regard to international transfers, unless required to do otherwise by Applicable Data Protection Law; in which case Propvora shall inform the Controller of that legal requirement before Processing, unless the law prohibits such information on important grounds of public interest. The Controller&rsquo;s instructions are constituted by this DPA, the Terms, the configuration of the Service, and any further written instructions agreed by the parties.</li>
          <li><strong>Unlawful instructions:</strong> Immediately inform the Controller if, in Propvora&rsquo;s opinion, an instruction infringes Applicable Data Protection Law.</li>
          <li><strong>Confidentiality:</strong> Ensure that persons authorised to Process the Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality, and that access is limited to those who need it to provide the Service.</li>
          <li><strong>Security:</strong> Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk in accordance with Article 32 UK GDPR, as further described in section 9.</li>
          <li><strong>Sub-processors:</strong> Engage Sub-processors only in compliance with the conditions set out in section 7 (including the conditions referred to in Article 28(2) and (4) UK GDPR).</li>
          <li><strong>Data subject rights:</strong> Taking into account the nature of the Processing, assist the Controller by appropriate technical and organisational measures, insofar as this is possible, in fulfilling the Controller&rsquo;s obligation to respond to requests for exercising the Data Subject&rsquo;s rights under Chapter III of the UK GDPR (Articles 12 to 23), as further described in section 11.</li>
          <li><strong>Compliance assistance:</strong> Assist the Controller in ensuring compliance with its obligations under Articles 32 to 36 UK GDPR, taking into account the nature of Processing and the information available to Propvora, including security of Processing, notification and communication of Personal Data Breaches, data protection impact assessments, and prior consultation with the ICO.</li>
          <li><strong>Deletion or return:</strong> At the choice of the Controller, delete or return all Personal Data to the Controller after the end of the provision of Services, and delete existing copies unless Applicable Data Protection Law requires storage of the Personal Data, as further described in section 13.</li>
          <li><strong>Demonstrating compliance:</strong> Make available to the Controller all information necessary to demonstrate compliance with the obligations laid down in Article 28 UK GDPR, and allow for and contribute to audits, including inspections, conducted by the Controller or another auditor mandated by the Controller, as further described in section 12.</li>
        </ul>
      </Section>

      <Section num="5" title="Controller Obligations">
        <p>The Controller agrees and warrants that it shall:</p>
        <ul>
          <li>Establish and maintain a lawful basis under Article 6 UK GDPR (and, where applicable, a condition under Article 9 or 10) for the Processing of all Personal Data stored in the Propvora workspace</li>
          <li>Comply with all of its obligations under Applicable Data Protection Law, including the UK GDPR and the DPA 2018, in respect of the Personal Data and the instructions it gives to Propvora</li>
          <li>Provide clear, accurate and fair transparency information (privacy notices) to Data Subjects whose Personal Data is stored in the workspace</li>
          <li>Ensure that its documented instructions to Propvora are lawful and that the Processing carried out on those instructions will not cause Propvora to breach Applicable Data Protection Law</li>
          <li>Respond to Data Subject requests, complaints and enquiries using the tools provided in the Propvora platform and with Propvora&rsquo;s assistance where required</li>
          <li>Notify Propvora promptly of any Data Subject request, complaint, regulatory enquiry or suspected incident that relates to workspace data and requires Propvora&rsquo;s involvement</li>
          <li>Not submit special category Personal Data (Article 9) or criminal offence data (Article 10) to the Service unless it is strictly necessary, the Controller has identified an appropriate condition for Processing, and the Controller has implemented appropriate safeguards</li>
          <li>Be solely responsible for the accuracy, quality and legality of the Personal Data and the means by which the Controller acquired it</li>
        </ul>
      </Section>

      <Section num="6" title="Sub-Processors">
        <p>
          The Controller grants Propvora general authorisation to engage Sub-processors to Process Personal Data in connection with the provision of the Service. A current list of authorised Sub-processors, including those set out below, is maintained at <a href="/legal/subprocessors">/legal/subprocessors</a>. The Sub-processors currently engaged are:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Sub-Processor</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Location</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Transfer Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase Inc.", "Database hosting, authentication, file storage", "EU (AWS Frankfurt)", "EU Standard Terms"],
                ["Stripe Inc.", "Payment processing and subscription management", "USA / EU", "UK IDTA / UK Addendum"],
                ["Resend Inc.", "Transactional and notification email delivery", "USA", "UK IDTA / UK Addendum"],
                ["OpenAI LP", "AI Copilot language model processing", "USA", "UK IDTA / UK Addendum"],
                ["Cloudflare Inc.", "CDN, security, R2 object storage", "Global (EU data residency options)", "UK IDTA / UK Addendum"],
                ["Vercel Inc.", "Platform hosting and serverless compute", "USA / EU", "UK IDTA / UK Addendum"],
              ].map(([name, purpose, location, mechanism]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{location}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Notice and right to object.</strong> Propvora will give the Controller at least 30 days&rsquo; prior notice of the intended addition or replacement of any Sub-processor by updating the list at <a href="/legal/subprocessors">/legal/subprocessors</a> and/or by notice to the Controller. During that notice period the Controller may object, on reasonable data-protection grounds, to the appointment of a new Sub-processor. The parties will work together in good faith to resolve the objection. If the objection cannot be resolved, the Controller may, as its sole and exclusive remedy, terminate the affected part of the Service (or the Service as a whole, where the affected part cannot reasonably be separated) by giving written notice, without prejudice to fees already incurred.
        </p>
        <p>
          <strong>Flow-down and liability.</strong> Where Propvora engages a Sub-processor, it shall do so by way of a written contract imposing on the Sub-processor data-protection obligations that are substantially equivalent to, and no less protective than, those imposed on Propvora under this DPA, in particular providing sufficient guarantees to implement appropriate technical and organisational measures. Propvora shall remain fully liable to the Controller for the performance of each Sub-processor&rsquo;s data-protection obligations.
        </p>
      </Section>

      <Section num="7" title="International Transfers">
        <p>
          Propvora hosts and Processes Personal Data primarily within the United Kingdom and the European Economic Area (EEA), with the Controller&rsquo;s primary database, authentication and file storage located in the EU (AWS Frankfurt).
        </p>
        <p>
          Where the provision of the Service requires the transfer of Personal Data to a country outside the UK that is not the subject of UK adequacy regulations, Propvora and its Sub-processors will ensure that the transfer is subject to appropriate safeguards under Article 46 UK GDPR. In particular, Propvora relies on:
        </p>
        <ul>
          <li>the UK International Data Transfer Agreement (UK IDTA) issued by the Information Commissioner; and/or</li>
          <li>the EU Standard Contractual Clauses as supplemented by the UK Addendum (the International Data Transfer Addendum to the EU SCCs),</li>
        </ul>
        <p>
          together with, where appropriate, transfer risk assessments and supplementary technical, contractual and organisational measures to ensure that Data Subjects are afforded a level of protection essentially equivalent to that guaranteed within the UK. The Controller is deemed to enter into the relevant transfer mechanism, where it is itself a party, by accepting this DPA. A copy of the relevant transfer mechanism is available on request to <a href="mailto:legal@propvora.com">legal@propvora.com</a>.
        </p>
      </Section>

      <Section num="8" title="Security Measures">
        <p>
          Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of Processing, as well as the risks to the rights and freedoms of Data Subjects, Propvora implements appropriate technical and organisational measures in accordance with Article 32 UK GDPR, including:
        </p>
        <ul>
          <li><strong>Encryption in transit:</strong> All data is encrypted using TLS 1.2 or higher</li>
          <li><strong>Encryption at rest:</strong> Database and storage encryption using AES-256</li>
          <li><strong>Access controls:</strong> Role-based access control with the principle of least privilege</li>
          <li><strong>Workspace isolation:</strong> Row-level security ensures complete data isolation between tenants</li>
          <li><strong>Authentication:</strong> Multi-factor authentication available for all user accounts</li>
          <li><strong>Pseudonymisation and minimisation:</strong> Data minimisation and, where appropriate, pseudonymisation are applied in analytics and AI contexts</li>
          <li><strong>Audit logging:</strong> All data access and modification events are logged</li>
          <li><strong>Resilience:</strong> Measures to ensure the ongoing confidentiality, integrity, availability and resilience of Processing systems and services</li>
          <li><strong>Backup and recovery:</strong> Daily automated backups with 30-day retention and the ability to restore availability and access to Personal Data in a timely manner in the event of an incident</li>
          <li><strong>Vulnerability management:</strong> Regular security reviews, dependency updates and a process for regularly testing, assessing and evaluating the effectiveness of measures</li>
          <li><strong>Incident response:</strong> A documented incident response procedure with a 72-hour notification commitment</li>
        </ul>
        <p>
          Further detail on Propvora&rsquo;s security programme is available at <a href="/legal/security">/legal/security</a>. Propvora may update these measures from time to time provided that the updated measures do not materially reduce the overall level of security of the Service.
        </p>
      </Section>

      <Section num="9" title="Personal Data Breach">
        <p>
          In the event of a Personal Data Breach affecting the Controller&rsquo;s workspace data, Propvora shall:
        </p>
        <ul>
          <li>Notify the Controller without undue delay, and in any event within 72 hours, after becoming aware of the Personal Data Breach</li>
          <li>Provide, to the extent known and as it becomes available, a description of the nature of the breach including, where possible, the categories and approximate number of Data Subjects and Personal Data records concerned; the likely consequences of the breach; the name and contact details of a point of contact from whom more information can be obtained; and the measures taken or proposed to address the breach and mitigate its possible adverse effects</li>
          <li>Cooperate fully with, and take such reasonable steps as are directed by, the Controller to assist in the investigation, mitigation and remediation of the breach</li>
          <li>Notify the Controller at the email address held on the account and via the in-app notification system</li>
        </ul>
        <p>
          The Controller remains responsible for assessing whether the Personal Data Breach is notifiable, and for making any required notification to the ICO (within 72 hours where required under Article 33 UK GDPR) and any communication to affected Data Subjects (under Article 34). Propvora&rsquo;s notification is not, and shall not be construed as, an acknowledgement of fault or liability.
        </p>
      </Section>

      <Section num="10" title="Data Subject Rights Assistance">
        <p>
          Taking into account the nature of the Processing, Propvora shall assist the Controller, by appropriate technical and organisational measures and insofar as this is possible, in the fulfilment of the Controller&rsquo;s obligation to respond to requests by Data Subjects to exercise their rights under Chapter III of the UK GDPR, including the rights of access, rectification, erasure, restriction, data portability, and objection.
        </p>
        <ul>
          <li>The Controller can action the majority of Data Subject requests directly through the in-app tools provided in the Propvora platform, including data export, rectification and deletion functions</li>
          <li>If Propvora receives a request directly from a Data Subject relating to the Controller&rsquo;s workspace data, Propvora will not respond to the request itself (except to confirm receipt and direct the Data Subject to the Controller where appropriate) but will, without undue delay, notify and refer the request to the Controller</li>
          <li>Where a request cannot be fulfilled through the in-app tools, Propvora will provide reasonable additional assistance to the Controller; Propvora may charge a reasonable fee for assistance that is manifestly excessive or that falls outside the standard functionality of the Service</li>
        </ul>
      </Section>

      <Section num="11" title="Audit and Inspection">
        <p>
          Propvora shall make available to the Controller all information reasonably necessary to demonstrate compliance with this DPA and Article 28 UK GDPR, and shall allow for and contribute to audits, including inspections, conducted by the Controller or an independent auditor mandated by the Controller, subject to the following:
        </p>
        <ul>
          <li>The Controller may request an audit no more than once in any twelve-month period, save where an audit is required by a competent supervisory authority or where the Controller reasonably believes a Personal Data Breach affecting its workspace data has occurred</li>
          <li>The Controller shall give Propvora at least 30 days&rsquo; prior written notice of any audit, and audits shall be conducted during normal business hours, in a manner that does not unreasonably disrupt Propvora&rsquo;s operations and does not compromise the security or confidentiality of other customers&rsquo; data</li>
          <li>Propvora may satisfy an audit request by providing relevant third-party certifications, audit reports, security questionnaires and summaries of its technical and organisational measures, where these reasonably demonstrate compliance</li>
          <li>Each party shall bear its own costs in connection with an audit, save that the Controller shall reimburse Propvora&rsquo;s reasonable costs for any audit beyond the scope set out above</li>
          <li>All information obtained in the course of an audit is the confidential information of Propvora and may be used by the Controller solely for the purpose of verifying compliance with this DPA</li>
        </ul>
      </Section>

      <Section num="12" title="Return and Deletion of Data">
        <p>
          On termination or expiry of the Terms, or earlier on the Controller&rsquo;s written request, and at the choice of the Controller, Propvora shall:
        </p>
        <ul>
          <li>Provide the Controller with access to export its workspace Personal Data, in a structured, commonly used and machine-readable format, for a period of 30 days following termination</li>
          <li>Following the 30-day export window, permanently and securely delete all workspace Personal Data from active systems</li>
          <li>Delete existing copies of the Personal Data, save to the extent that retention is required by Applicable Data Protection Law, in which case Propvora shall continue to protect the retained data and Process it only to the extent and for the period required by that law</li>
          <li>Certify deletion in writing to the Controller on request</li>
          <li>Procure that its Sub-processors delete the relevant Personal Data in accordance with equivalent obligations</li>
        </ul>
        <p>
          Personal Data held in routine, encrypted backups will be retained for no longer than the backup rotation cycle and will be deleted, or rendered inaccessible and overwritten, on expiry of that cycle. Backups are not used to restore deleted workspaces except as part of a documented disaster-recovery event.
        </p>
      </Section>

      <Section num="13" title="Liability and Indemnity">
        <p>
          Each party shall be liable for, and shall indemnify the other against, any losses arising from its own breach of its obligations under Applicable Data Protection Law in respect of the Personal Data Processed under this DPA, to the extent caused by that party&rsquo;s breach.
        </p>
        <p>
          The total aggregate liability of each party arising out of or in connection with this DPA, whether in contract, tort (including negligence), breach of statutory duty or otherwise, shall be subject to, and counts towards, the exclusions and limitations of liability set out in the Terms. The limitations and exclusions in the Terms apply to this DPA as if set out in full here.
        </p>
        <p>
          Nothing in this DPA or the Terms limits or excludes either party&rsquo;s liability where, or to the extent that, it cannot lawfully be limited or excluded, including liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any liability of a Controller or Processor to a Data Subject or supervisory authority that cannot be limited or excluded under Applicable Data Protection Law.
        </p>
      </Section>

      <Section num="14" title="Term and Termination">
        <p>
          This DPA takes effect on the date the Controller first accepts the Terms or first uses the Service to Process Personal Data on behalf of others, whichever is earlier, and remains in force for as long as Propvora Processes Personal Data on behalf of the Controller. This DPA is coterminous with the Terms: it terminates automatically on termination or expiry of the Terms.
        </p>
        <p>
          The obligations set out in this DPA that by their nature are intended to survive termination &mdash; including those relating to confidentiality, return and deletion of data (section 12), liability (section 13), audit cooperation in respect of past Processing, and governing law &mdash; shall survive termination or expiry of this DPA for so long as Propvora retains any Personal Data of the Controller or as required to give effect to those obligations.
        </p>
      </Section>

      <Section num="15" title="Governing Law and Jurisdiction">
        <p>
          This DPA and any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with it or its subject matter or formation are governed by, and construed in accordance with, the law of England and Wales. The parties irrevocably agree that the courts of England and Wales shall have exclusive jurisdiction to settle any such dispute or claim.
        </p>
      </Section>

      <Section num="16" title="Order of Precedence">
        <p>
          This DPA forms part of the Terms. In the event of any conflict or inconsistency between this DPA and any other agreement between the parties (including the Terms) on the subject of data protection or the Processing of Personal Data, the provisions of this DPA shall prevail to the extent of that conflict. In all other respects, the Terms continue in full force and effect.
        </p>
      </Section>

      <Section num="17" title="Contact">
        <p>
          For any questions about this DPA, to request a copy of the relevant international transfer mechanism, or for any other data-protection matter, please contact our data protection team at <a href="mailto:legal@propvora.com">legal@propvora.com</a>, or write to Blackwellen Ltd (trading as Propvora), 61 Bridge Street, Kington, England, HR5 3DJ. Propvora is registered with the Information Commissioner&rsquo;s Office under registration number ZC160806.
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
