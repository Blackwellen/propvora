import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Security & Trust | Propvora",
  description: "How Propvora protects your data — infrastructure, encryption, access control, AI processing security, monitoring, breach response, and responsible disclosure.",
}

export default function SecurityPage() {
  return (
    <LegalLayout title="Security & Trust" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This Security &amp; Trust statement describes the technical and organisational measures that Blackwellen Ltd (Company No. 16482166), trading as Propvora, applies to protect personal data and the integrity of the Propvora platform. It is intended to give our business customers a clear, accurate account of how we keep their workspace data safe. It should be read alongside our <a href="/legal/privacy">Privacy Policy</a>, <a href="/legal/data-processing">Data Processing Agreement</a>, and <a href="/legal/subprocessors">Subprocessors</a> page.
      </div>

      <Section num="1" title="Our Security Commitment">
        <p>
          Propvora is operated by Blackwellen Ltd, a company registered in England and Wales (Company No. 16482166), with its registered office at 61 Bridge Street, Kington, England, HR5 3DJ, and registered with the Information Commissioner&rsquo;s Office under registration number ZC160806. We are committed to protecting the confidentiality, integrity, and availability of the data entrusted to us.
        </p>
        <p>
          As a data processor for our business customers, we are required under Article 32 of the UK General Data Protection Regulation (&ldquo;UK GDPR&rdquo;) and the Data Protection Act 2018 to implement &ldquo;appropriate technical and organisational measures&rdquo; to ensure a level of security appropriate to the risk. The measures described in this statement are designed to meet that standard, taking into account the state of the art, the costs of implementation, and the nature, scope, context, and purposes of the processing, as well as the risk to the rights and freedoms of the individuals whose data we handle.
        </p>
        <p>
          This statement covers the production Propvora platform &mdash; the web application, supporting application programming interfaces, databases, file storage, and the third-party infrastructure providers we rely upon to deliver the Service. It applies to all workspaces and to the personal data of tenants, landlords, suppliers, and professional contacts that customers choose to store within their workspace.
        </p>
      </Section>

      <Section num="2" title="Infrastructure & Hosting">
        <p>
          Propvora is built on reputable, independently certified cloud infrastructure providers. We do not operate our own physical data centres; instead, we rely on established providers whose facilities maintain recognised industry certifications (such as ISO 27001 and SOC 2) and robust physical, environmental, and network security controls.
        </p>
        <ul>
          <li><strong>Database, authentication, and primary storage:</strong> Hosted by Supabase on Amazon Web Services infrastructure located in the EU (Frankfurt, Germany), providing EU data residency for the core application database.</li>
          <li><strong>Object and file storage:</strong> Documents, images, and uploaded evidence are stored using Cloudflare R2 object storage, configured for EU data residency where supported.</li>
          <li><strong>Application compute and delivery:</strong> The Propvora web application and serverless functions run on Vercel&rsquo;s platform, with content delivery and edge security provided by Cloudflare.</li>
        </ul>
        <p>
          A complete and current list of the third-party providers that process personal data on our behalf, together with their purpose, location, and applicable data transfer mechanism, is maintained on our <a href="/legal/subprocessors">Subprocessors</a> page.
        </p>
      </Section>

      <Section num="3" title="Encryption">
        <p>
          We protect data both while it travels across networks and while it is stored at rest:
        </p>
        <ul>
          <li><strong>Encryption in transit:</strong> All connections to the Propvora platform are secured using Transport Layer Security (TLS) version 1.2 or higher. Plain-text connections are not accepted, and traffic between our application and our infrastructure providers is likewise encrypted.</li>
          <li><strong>Encryption at rest:</strong> Personal data held in our databases and object storage is encrypted at rest using the Advanced Encryption Standard with 256-bit keys (AES-256), managed by our infrastructure providers.</li>
        </ul>
        <p>
          Encryption keys are managed by our infrastructure providers under their own certified key-management practices and are not exposed to application code or to end users.
        </p>
      </Section>

      <Section num="4" title="Access Control & Tenancy Isolation">
        <p>
          Access to systems and data is governed by the principle of least privilege &mdash; people and processes are granted only the access strictly necessary to perform their function, and no more.
        </p>
        <ul>
          <li><strong>Role-based access control:</strong> Within each customer workspace, permissions are assigned by role, so that individual team members can only see and act on the data appropriate to their role.</li>
          <li><strong>Workspace isolation:</strong> The platform enforces complete logical isolation between customer workspaces using PostgreSQL row-level security. Every query against tenant data is constrained at the database layer to the requesting user&rsquo;s authorised workspace, so that no customer can access another customer&rsquo;s data, even through direct application programming interface calls.</li>
          <li><strong>Administrative access:</strong> Internal administrative access to production systems is restricted to a small number of authorised personnel, granted on a need-to-know basis, and is subject to confidentiality obligations.</li>
          <li><strong>Multi-factor authentication:</strong> Multi-factor authentication is available to all account holders and is strongly recommended for accounts with administrative or financial permissions.</li>
        </ul>
      </Section>

      <Section num="5" title="Application Security">
        <p>
          Security is built into the design of the Propvora application rather than added as an afterthought. Our application-level controls include:
        </p>
        <ul>
          <li><strong>Input validation:</strong> User-supplied data is validated on both the client and the server before it is processed or stored.</li>
          <li><strong>Output sanitisation:</strong> Content rendered in the interface is sanitised to defend against cross-site scripting (XSS) and related injection attacks.</li>
          <li><strong>Mutation safety:</strong> State-changing operations are protected against cross-site request forgery (CSRF) and require an authenticated, authorised session.</li>
          <li><strong>Authentication:</strong> User authentication is handled through Supabase Auth, providing secure session management, password hashing, and support for multi-factor authentication.</li>
          <li><strong>Secret management:</strong> Application secrets, service-role credentials, and provider keys are held server-side only and are never exposed in client-side code or browser bundles.</li>
          <li><strong>Content-Security-Policy:</strong> A Content-Security-Policy is applied to constrain the sources from which scripts, styles, and other resources may load, reducing the impact of any injection vulnerability.</li>
        </ul>
      </Section>

      <Section num="6" title="AI Processing Security">
        <p>
          The Propvora AI Copilot is designed so that artificial intelligence features enhance the Service without compromising data protection. Our AI processing is governed by the following safeguards:
        </p>
        <ul>
          <li><strong>GDPR-compliant providers only:</strong> AI requests are routed exclusively to providers that offer EU or UK-appropriate data handling. This includes Azure OpenAI (EU) deployments and, where applicable, Anthropic and Google under UK Standard Contractual Clauses. We do not route customer data to providers that cannot offer adequate data protection safeguards.</li>
          <li><strong>No third-party model training:</strong> Customer and tenant data submitted to AI providers in the course of providing the Service is not used to train those providers&rsquo; models. Our provider arrangements expressly exclude such use.</li>
          <li><strong>Human review before action:</strong> AI-generated suggestions and drafts are presented for human review and explicit confirmation before any action with external effect is taken. The Copilot does not autonomously execute changes on a customer&rsquo;s behalf without that confirmation.</li>
          <li><strong>Scoped grounding:</strong> AI features operate only on data the requesting user is already permitted to access, within the boundaries enforced by row-level security; they cannot be used to reach data outside the user&rsquo;s authorised workspace.</li>
        </ul>
      </Section>

      <Section num="7" title="Monitoring, Logging & Error Tracking">
        <p>
          We maintain visibility over the operation and security of the platform so that we can detect, investigate, and respond to issues promptly:
        </p>
        <ul>
          <li><strong>Audit logging:</strong> Access to and modification of workspace data is recorded in audit logs, providing an account of who did what and when within a workspace.</li>
          <li><strong>Error monitoring:</strong> Application errors are captured through Sentry error monitoring, configured to operate within the EU region, enabling us to identify and resolve faults that could affect availability or integrity.</li>
          <li><strong>Rate limiting and abuse protection:</strong> Sensitive and public-facing endpoints are protected by rate limiting and abuse-detection controls to mitigate automated attacks, credential stuffing, and denial-of-service attempts.</li>
        </ul>
      </Section>

      <Section num="8" title="Backups & Resilience">
        <p>
          To protect against data loss and to support recovery from disruption, we maintain the following resilience measures:
        </p>
        <ul>
          <li><strong>Automated backups:</strong> The production database is backed up automatically on a daily basis.</li>
          <li><strong>Retention:</strong> Backups are retained for a rolling period of 30 days, allowing recovery to a recent point in time.</li>
          <li><strong>Disaster recovery:</strong> We maintain disaster recovery procedures designed to restore service and data following a significant infrastructure failure, drawing on the redundancy and high-availability features of our underlying providers.</li>
        </ul>
      </Section>

      <Section num="9" title="Vulnerability Management & Responsible Disclosure">
        <p>
          We take a proactive approach to identifying and remediating security weaknesses, including keeping software dependencies up to date, applying security patches in a timely manner, and conducting security reviews of new and changed functionality.
        </p>
        <p>
          We welcome reports from the security research community. If you believe you have discovered a security vulnerability in Propvora, please report it to us at <a href="mailto:security@propvora.com">security@propvora.com</a> with sufficient detail for us to reproduce and assess the issue. We ask that you give us a reasonable opportunity to investigate and remediate before any public disclosure, and that you avoid accessing, modifying, or deleting data that does not belong to you, and avoid any action that could degrade the Service for other users.
        </p>
        <p>
          <strong>Safe harbour:</strong> We will not pursue or support legal action against security researchers who, acting in good faith, identify and report vulnerabilities to us in accordance with this coordinated disclosure approach and who do not exploit a vulnerability beyond the minimum necessary to demonstrate it.
        </p>
      </Section>

      <Section num="10" title="Personal Data Breach Response">
        <p>
          We maintain a documented incident response procedure to govern our handling of suspected and confirmed personal data breaches. In the event of an incident affecting personal data, we will:
        </p>
        <ul>
          <li><strong>Assess:</strong> Promptly assess the nature, scope, and likely consequences of the incident, including the categories and approximate number of data subjects and records affected.</li>
          <li><strong>Contain:</strong> Take immediate steps to contain the incident, mitigate its effects, and prevent recurrence.</li>
          <li><strong>Notify customers:</strong> Notify affected business customers (acting as data controllers) without undue delay and, where feasible, within 72 hours of becoming aware of the breach, providing the information they need to meet their own obligations.</li>
          <li><strong>Support regulatory reporting:</strong> Assist and cooperate with our customers in any notification they are required to make to the Information Commissioner&rsquo;s Office (ICO) and to affected individuals, while ensuring we meet our own responsibilities under the UK GDPR.</li>
        </ul>
        <p>
          As a processor, we notify the controller; the controller remains responsible for determining whether and how to notify the ICO and affected data subjects, save where Propvora is acting as a controller in its own right.
        </p>
      </Section>

      <Section num="11" title="Sub-processors & Data Transfers">
        <p>
          We engage a limited number of trusted third-party providers (sub-processors) to help us deliver the Service. The current list of sub-processors, with their purpose, location, and applicable safeguards, is published on our <a href="/legal/subprocessors">Subprocessors</a> page. The contractual terms governing our processing of customer data, including our processor obligations, are set out in our <a href="/legal/data-processing">Data Processing Agreement</a>.
        </p>
        <p>
          Where personal data is transferred to a country outside the United Kingdom or the European Economic Area, we rely on lawful transfer mechanisms &mdash; including the UK Standard Contractual Clauses (SCCs) and the International Data Transfer Agreement (IDTA) approved by the ICO &mdash; together with any additional safeguards required to ensure that the transferred data continues to enjoy an essentially equivalent level of protection.
        </p>
      </Section>

      <Section num="12" title="Your Responsibilities">
        <p>
          Security is a shared responsibility. While we protect the platform and the infrastructure beneath it, the security of your workspace also depends on the practices of your team. We ask that you:
        </p>
        <ul>
          <li>Choose strong, unique passwords and never reuse them across services.</li>
          <li>Enable multi-factor authentication on all accounts, and require it for users with administrative or financial permissions.</li>
          <li>Carefully manage team access &mdash; grant the minimum role necessary, review membership regularly, and promptly remove access for people who leave your organisation.</li>
          <li>Keep your devices, browsers, and operating systems up to date and protected.</li>
          <li>Report any suspicious activity, suspected account compromise, or potential security concern to us promptly using the contacts below.</li>
        </ul>
      </Section>

      <Section num="13" title="Contact">
        <p>
          To report a security concern, suspected vulnerability, or potential abuse, please contact our security team at <a href="mailto:security@propvora.com">security@propvora.com</a>. For general support, you can reach us at <a href="mailto:support@propvora.com">support@propvora.com</a>. For legal enquiries, please write to <a href="mailto:legal@propvora.com">legal@propvora.com</a>.
        </p>
      </Section>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm mt-10">
        This statement describes our current security measures and may evolve as the Service develops, as technology advances, and as the threat landscape changes. Nothing in this statement reduces or replaces our customers&rsquo; own statutory obligations under the UK GDPR, the Data Protection Act 2018, or any other applicable law, including their responsibilities as data controllers. This statement is governed by the laws of England and Wales.
      </div>
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
