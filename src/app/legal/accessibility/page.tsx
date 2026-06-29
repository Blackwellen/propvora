import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Accessibility Statement | Propvora",
  description: "Propvora Accessibility Statement — our commitment to WCAG 2.2 Level AA, the measures we take, known limitations, and how to report a barrier or request an accessible format.",
}

export default function AccessibilityPage() {
  return (
    <LegalLayout title="Accessibility Statement" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This statement explains how accessible the Propvora platform is, the steps we take to make it usable by everyone, the limitations we are aware of, and how to contact us if you encounter a barrier or need information in an accessible format. Propvora is operated by Blackwellen Ltd (Company No. 16482166), trading as Propvora.
      </div>

      <Section num="1" title="Our Commitment">
        <p>
          We want everyone to be able to use Propvora, regardless of ability, assistive technology, or device. We aim to conform to the Web Content Accessibility Guidelines (WCAG) version 2.2 at Level AA, which is the internationally recognised benchmark for accessible digital products.
        </p>
        <p>
          Under the <strong>Equality Act 2010</strong> we recognise our duty to make reasonable adjustments so that disabled users are not placed at a substantial disadvantage when using our service. We take this duty seriously and treat accessibility as an ongoing part of how we design, build, and test the product &mdash; not a one-off exercise.
        </p>
        <p>
          Propvora is a private, business-to-business software-as-a-service product and is not, in itself, subject to the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018. Nevertheless, we voluntarily align with the spirit of those regulations, because we believe accessible software is simply better software, and because many of our customers are themselves public bodies, charities, or organisations with their own accessibility obligations.
        </p>
      </Section>

      <Section num="2" title="Measures We Take">
        <p>
          Accessibility is built into our design system and shared components, so that improvements apply consistently across the product rather than page by page. The measures we take include:
        </p>
        <ul>
          <li><strong>Keyboard navigation:</strong> Interactive elements can be reached and operated using a keyboard alone, in a logical and predictable tab order, without requiring a mouse or touch input.</li>
          <li><strong>Visible focus states:</strong> The element that currently has keyboard focus is clearly indicated with a visible focus outline, so keyboard and switch-device users can always tell where they are.</li>
          <li><strong>ARIA roles and semantics:</strong> Interactive components such as tabs, dialogs, menus, accordions, alerts, and navigation regions use appropriate semantic HTML and ARIA roles so that their purpose and state are conveyed to assistive technology.</li>
          <li><strong>Labels for icon-only controls:</strong> Buttons and controls that rely on an icon alone carry descriptive accessible names, so screen-reader users understand what each control does.</li>
          <li><strong>Sufficient colour contrast:</strong> Text, essential controls, and meaningful indicators are designed to meet WCAG AA contrast ratios against their backgrounds.</li>
          <li><strong>No reliance on colour alone:</strong> Where colour conveys meaning &mdash; for example status badges or chart segments &mdash; we pair it with text labels, icons, or patterns so the information does not depend on colour perception.</li>
          <li><strong>Responsive and zoomable layouts:</strong> The interface reflows to a wide range of screen sizes and supports browser zoom and increased text size without loss of content or functionality.</li>
          <li><strong>Skip-to-content link:</strong> A skip link is provided so keyboard and screen-reader users can bypass repeated navigation and move directly to the main content of each page.</li>
          <li><strong>Clear forms and error handling:</strong> Form fields are labelled, grouped where appropriate, and validation messages are associated with the fields they relate to so errors can be understood and corrected.</li>
        </ul>
      </Section>

      <Section num="3" title="Conformance Status">
        <p>
          The WCAG 2.2 AA standard describes three levels of conformance: fully conformant, partially conformant, and non-conformant. Propvora is <strong>partially conformant</strong> with WCAG 2.2 Level AA. &ldquo;Partially conformant&rdquo; means that most of the platform meets the standard, but some parts do not yet fully conform.
        </p>
        <p>
          We have chosen to be honest rather than to overstate our position. The large majority of everyday workflows &mdash; navigating, reading content, completing forms, managing records, and moving between sections &mdash; meet Level AA. Certain more complex or visually rich surfaces, including data tables, interactive maps, drag-and-drop boards, and rich charts, may have known limitations that we are actively working to address. These are described in the next section.
        </p>
      </Section>

      <Section num="4" title="Known Limitations">
        <p>
          We are aware of the following limitations. We are working to reduce or remove them, and we describe the alternatives that are available in the meantime:
        </p>
        <ul>
          <li><strong>Interactive maps:</strong> Map views that plot properties or service areas are inherently visual and may be difficult to interpret using a screen reader. Where mapped data exists, the same records are also available in accessible list or table form so that the underlying information can still be reached without using the map.</li>
          <li><strong>Rich charts and data visualisations:</strong> Some charts, graphs, and dashboards convey trends visually and may not be fully described to assistive technology in every case. We aim to provide the underlying figures in an accessible format and are improving text alternatives over time.</li>
          <li><strong>Drag-and-drop boards:</strong> Kanban-style boards and reorderable lists use drag-and-drop, which can be difficult for keyboard-only and screen-reader users. Where reordering or moving an item is supported, we provide keyboard-accessible alternatives wherever possible; we are working to make these available consistently across all such surfaces.</li>
          <li><strong>Complex data tables:</strong> Large tables with many columns, sorting, and filtering can be challenging to navigate with assistive technology, particularly on small screens. We continue to improve table semantics, headers, and responsive behaviour.</li>
          <li><strong>Third-party embedded content:</strong> Some functionality relies on embedded content provided by third parties &mdash; for example payment forms supplied by Stripe and map tiles supplied by our mapping providers. The accessibility of that embedded content is partly outside our direct control, although we choose providers with accessibility in mind and will help you find an alternative route to complete a task where one is needed.</li>
        </ul>
      </Section>

      <Section num="5" title="Assistive Technologies Supported">
        <p>
          We design and test Propvora to work with current and recent versions of mainstream assistive technologies and browsers. This includes, but is not limited to:
        </p>
        <ul>
          <li>Screen readers such as NVDA and JAWS on Windows, VoiceOver on macOS and iOS, and TalkBack on Android</li>
          <li>Recent versions of major browsers, including Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari</li>
          <li>Browser zoom, increased text size, and operating-system display and contrast settings</li>
          <li>Keyboard-only and switch-based navigation</li>
        </ul>
        <p>
          We recommend keeping your browser and assistive technology up to date for the best experience. If you use a configuration we do not yet support well, please tell us &mdash; your feedback directly informs what we fix next.
        </p>
      </Section>

      <Section num="6" title="Feedback and Contact">
        <p>
          We welcome your feedback on the accessibility of Propvora. If you encounter a barrier, find that something does not work with your assistive technology, or need information or a feature provided in a different, accessible format, please contact us:
        </p>
        <ul>
          <li>By email at <a href="mailto:support@propvora.com">support@propvora.com</a></li>
        </ul>
        <p>
          Please include the page or feature you were using, what you were trying to do, the assistive technology and browser you were using, and what went wrong. The more detail you can give, the more quickly we can help.
        </p>
        <p>
          We aim to acknowledge accessibility feedback and requests for accessible formats <strong>within 5 working days</strong>. Where a request requires more substantial work, we will give you a realistic timescale and keep you informed of progress.
        </p>
      </Section>

      <Section num="7" title="Enforcement and Escalation">
        <p>
          We are committed to resolving accessibility issues, and we would always prefer the chance to put things right directly. If you contact us about a barrier, we will work with you to find a solution.
        </p>
        <p>
          If you are based in Great Britain and are not satisfied with how we have responded to your concern, you can contact the <strong>Equality Advisory and Support Service (EASS)</strong>, which provides free, independent advice on equality and human rights issues, including digital accessibility. You can reach the EASS through its website at <a href="https://www.equalityadvisoryservice.com" target="_blank" rel="noopener noreferrer">www.equalityadvisoryservice.com</a>.
        </p>
        <p>
          Contacting the EASS does not affect your other legal rights, and we will continue to work with you to resolve any issue you have raised regardless of whether you choose to seek external advice.
        </p>
      </Section>

      <Section num="8" title="Preparation of This Statement">
        <p>
          This statement was prepared on <strong>29 June 2026</strong>. It is based on a self-assessment of the Propvora platform against the WCAG 2.2 Level AA success criteria, carried out by our own team using a combination of manual testing, keyboard and screen-reader checks, and automated tooling.
        </p>
        <p>
          We review this statement periodically and whenever we make significant changes to the platform, and we update it to reflect the current state of accessibility and any newly identified limitations or improvements.
        </p>
        <p>
          Blackwellen Ltd (Company No. 16482166), trading as Propvora, registered office: 61 Bridge Street, Kington, England, HR5 3DJ.
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
