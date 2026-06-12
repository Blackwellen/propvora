import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Cookie Policy | Propvora",
  description: "Propvora Cookie Policy — what cookies we use, why we use them, and how to manage your preferences.",
  openGraph: {
    title: "Cookie Policy | Propvora",
    description: "Propvora Cookie Policy — what cookies we use, why we use them, and how to manage your preferences.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Propvora",
    description: "Propvora Cookie Policy — what cookies we use, why we use them, and how to manage your preferences.",
  },
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="2 June 2025">
      <Section num="1" title="What Are Cookies?">
        <p>
          Cookies are small text files placed on your device when you visit a website. They allow the website to remember your preferences, maintain your session, and gather analytics about how the site is used. Cookies can be &ldquo;session cookies&rdquo; (deleted when you close your browser) or &ldquo;persistent cookies&rdquo; (stored for a defined period).
        </p>
        <p>
          This policy explains how Propvora uses cookies and similar technologies, and what controls you have over them.
        </p>
      </Section>

      <Section num="2" title="Cookies We Use">
        <p>We use the following categories of cookies:</p>

        <h3>Strictly Necessary Cookies</h3>
        <p>
          These cookies are essential for the Service to function and cannot be disabled. They are typically set in response to actions you take, such as logging in or setting preferences.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Cookie Name</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["sb-auth-token", "Supabase authentication session token", "Session"],
                ["sb-refresh-token", "Supabase session refresh token", "7 days"],
                ["__Secure-next-auth.session-token", "Next.js session management", "Session"],
                ["propvora-theme", "User interface theme preference (light/dark)", "1 year"],
              ].map(([name, purpose, duration]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-mono text-xs">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Analytics Cookies</h3>
        <p>
          These cookies help us understand how users interact with the Service so we can improve it. Analytics data is aggregated and anonymised. These cookies are only set with your consent.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Cookie Name</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["_propvora_analytics", "Usage analytics and feature tracking", "90 days"],
                ["_propvora_session", "Session analytics (page views, flow tracking)", "Session"],
              ].map(([name, purpose, duration]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-mono text-xs">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Preference Cookies</h3>
        <p>
          These cookies remember your preferences and settings to provide a more personalised experience.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Cookie Name</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["propvora-sidebar", "Sidebar collapsed/expanded state", "1 year"],
                ["propvora-view-pref", "Default list/board/calendar view preference", "1 year"],
                ["cookie-consent", "Records your cookie consent preferences", "1 year"],
              ].map(([name, purpose, duration]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-mono text-xs">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="3" title="Third-Party Cookies">
        <p>
          Some of our third-party service providers may also set cookies on our platform. These are subject to each provider&rsquo;s privacy and cookie policies:
        </p>
        <ul>
          <li><strong>Stripe:</strong> Sets cookies for fraud prevention and payment session management. See <a href="https://stripe.com/cookies-policy" target="_blank" rel="noopener noreferrer">Stripe Cookie Policy</a>.</li>
          <li><strong>Cloudflare:</strong> Sets cookies for security, performance, and CDN functionality. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare Privacy Policy</a>.</li>
        </ul>
        <p>
          We do not use advertising or marketing tracking cookies, and we do not share cookie data with advertising networks.
        </p>
      </Section>

      <Section num="4" title="Your Cookie Choices">
        <p>You have the following options for managing cookies:</p>

        <h3>Cookie Consent Manager</h3>
        <p>
          When you first visit Propvora, you will be presented with a cookie consent notice. You can choose to accept all cookies, or customise your preferences by category. You can update your preferences at any time by clicking the cookie settings link in the footer.
        </p>

        <h3>Browser Settings</h3>
        <p>
          Most browsers allow you to control cookies through their settings. You can typically:
        </p>
        <ul>
          <li>Block all cookies</li>
          <li>Block third-party cookies only</li>
          <li>Delete existing cookies</li>
          <li>Set your browser to alert you when cookies are being set</li>
        </ul>
        <p>
          Note that blocking or deleting strictly necessary cookies will prevent the Service from functioning correctly. You will be logged out and your preferences will not be saved.
        </p>

        <h3>Browser-specific instructions:</h3>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
      </Section>

      <Section num="5" title="UK Cookie Law Compliance">
        <p>
          We comply with the UK Privacy and Electronic Communications Regulations (PECR) and the UK GDPR. We only set non-essential cookies with your prior consent. Our consent records include the date, version of the policy, and categories consented to.
        </p>
      </Section>

      <Section num="6" title="Contact">
        <p>
          If you have questions about our use of cookies, please contact us at <a href="mailto:privacy@propvora.com">privacy@propvora.com</a>.
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
