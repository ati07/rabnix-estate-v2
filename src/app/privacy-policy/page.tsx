import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy | BayBayt',
  description:
    'How BayBayt collects, uses, shares, and protects your personal information when you use our real estate platform.',
};

const LAST_UPDATED = '8 October 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F2A43]">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <BrandLogo variant="onLight" className="h-8 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative bg-[#0F2A43] text-white py-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#18A67D_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-slate-300 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8 text-sm leading-relaxed text-[#334155]">
        <section className="space-y-3">
          <p>
            This Privacy Policy explains how BayBayt (&ldquo;BayBayt&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo; or &ldquo;our&rdquo;) handles the personal information of people who
            visit our website, create an account, post a listing, or send an enquiry through our
            platform (together, the &ldquo;Services&rdquo;). By using the Services you agree to the
            practices described here. If you do not agree, please do not use the Services.
          </p>
        </section>

        <Section title="1. Information we collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Account details</strong> &mdash; your name, email address, phone number,
              password, and the role you register under (buyer, owner, agent, or builder).
            </li>
            <li>
              <strong>Listing and content data</strong> &mdash; property details, pricing, locality,
              descriptions, photos, and contact details you choose to publish in a listing or project.
            </li>
            <li>
              <strong>Enquiry data</strong> &mdash; messages, contact requests, and site-visit
              preferences you send to, or receive from, other users.
            </li>
            <li>
              <strong>Usage and device data</strong> &mdash; pages viewed, searches made, approximate
              location, browser type, device identifiers, and similar technical information collected
              automatically through cookies and comparable technologies.
            </li>
            <li>
              <strong>Location</strong> &mdash; if you allow it, your device&rsquo;s location is used
              to suggest the nearest city. You can decline, and we fall back to a coarse,
              network-based estimate.
            </li>
            <li>
              <strong>Payment data</strong> &mdash; when you buy a paid listing plan, payment is
              processed by our third-party payment gateway. We receive confirmation of the
              transaction but do not store your full card or banking details.
            </li>
          </ul>
        </Section>

        <Section title="2. How we use your information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To create and manage your account and authenticate you.</li>
            <li>To publish your listings and connect you with interested buyers, renters, or sellers.</li>
            <li>To route enquiries between users and enable direct contact.</li>
            <li>To provide tools such as AI property valuation estimates and loan EMI calculations.</li>
            <li>To process payments for paid listing plans and enforce listing quotas.</li>
            <li>To detect, prevent, and investigate fraud, abuse, and policy violations.</li>
            <li>To improve the Services, measure usage, and personalise what you see (such as your city).</li>
            <li>To send service-related communications and, where permitted, relevant updates.</li>
          </ul>
        </Section>

        <Section title="3. How we share information">
          <p>We do not sell your personal information. We share it only as follows:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>With other users</strong> &mdash; information you publish in a listing, and the
              contact details you submit with an enquiry, are visible to the relevant counterparty so
              that a property transaction can proceed.
            </li>
            <li>
              <strong>With service providers</strong> &mdash; payment gateways, hosting, and
              analytics providers who process data on our behalf under appropriate confidentiality
              obligations.
            </li>
            <li>
              <strong>For legal reasons</strong> &mdash; where required by law, regulation, legal
              process, or to protect the rights, safety, and property of BayBayt or others.
            </li>
            <li>
              <strong>Business transfers</strong> &mdash; in connection with a merger, acquisition, or
              sale of assets, subject to this Policy.
            </li>
          </ul>
        </Section>

        <Section title="4. Cookies and tracking">
          <p>
            We use cookies and local storage to keep you signed in, remember your selected city, and
            understand how the Services are used. Most browsers let you control or block cookies;
            disabling them may affect some features.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We keep your information for as long as your account is active or as needed to provide the
            Services, and afterwards only as required to comply with legal obligations, resolve
            disputes, and enforce our agreements. You can ask us to delete your account, after which we
            remove or anonymise your personal data except where retention is legally required.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use reasonable technical and organisational measures to protect your information,
            including hashed passwords and access controls. No method of transmission or storage is
            completely secure, so we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="7. Your rights and choices">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access, correct, or update your account information from your dashboard.</li>
            <li>Request deletion of your account and associated personal data.</li>
            <li>Opt out of non-essential communications.</li>
            <li>Decline location access and manage cookies through your browser or device settings.</li>
          </ul>
          <p>To exercise any of these rights, contact us using the details below.</p>
        </Section>

        <Section title="8. Third-party links">
          <p>
            The Services may link to third-party websites and services. We are not responsible for
            their content or privacy practices, and we encourage you to review their policies.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            The Services are not directed to children under 18, and we do not knowingly collect their
            personal information. If you believe a child has provided us data, please contact us.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this Policy from time to time. When we do, we will revise the &ldquo;Last
            updated&rdquo; date above, and material changes may be highlighted within the Services.
            Continued use after an update means you accept the revised Policy.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions about this Policy or your data? Email us at{' '}
            <a href="mailto:support@baybayt.com" className="text-[#18A67D] font-semibold hover:underline">
              support@baybayt.com
            </a>{' '}
            or call{' '}
            <a href="tel:+917991549436" className="text-[#18A67D] font-semibold hover:underline">
              +91 79915 49436
            </a>
            .
          </p>
        </Section>

        <p className="text-xs text-[#64748B] pt-4 border-t border-[#E2E8F0]">
          See also our{' '}
          <Link href="/terms" className="text-[#18A67D] font-semibold hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </main>

      {/* Bottom bar */}
      <div className="bg-[#091a2a] py-5 px-4 sm:px-8 text-[11px] text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} BayBayt. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-[#0F2A43]">{title}</h2>
      {children}
    </section>
  );
}
