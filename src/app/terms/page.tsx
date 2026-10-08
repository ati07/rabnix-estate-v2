import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'Terms & Conditions | BayBayt',
  description:
    'The terms that govern your use of the BayBayt real estate platform, including listings, enquiries, paid plans, and your responsibilities.',
};

const LAST_UPDATED = '8 October 2026';

export default function TermsPage() {
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-slate-300 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8 text-sm leading-relaxed text-[#334155]">
        <section className="space-y-3">
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the
            BayBayt website and services (the &ldquo;Services&rdquo;), operated by BayBayt
            (&ldquo;BayBayt&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;). By
            creating an account, posting a listing, or otherwise using the Services, you agree to
            these Terms. If you do not agree, do not use the Services.
          </p>
        </section>

        <Section title="1. Eligibility and accounts">
          <p>
            You must be at least 18 years old and able to form a binding contract to use the Services.
            You are responsible for the accuracy of the information you provide, for keeping your
            login credentials confidential, and for all activity under your account. Notify us
            promptly of any unauthorised use.
          </p>
        </Section>

        <Section title="2. Our role as a platform">
          <p>
            BayBayt is an online platform that lets owners, agents, and builders list properties and
            projects and lets buyers and renters discover and contact them. We are an intermediary; we
            are <strong>not</strong> a party to any transaction, agreement, or dealing between users,
            and we do not act as a broker, agent, or representative of any user. Any deal, booking,
            payment, or agreement you enter into with another user is solely between you and that user.
          </p>
        </Section>

        <Section title="3. Listings and user content">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              You must have the right to list a property or project and to share the details,
              photographs, and contact information you publish.
            </li>
            <li>
              Listings must be accurate, lawful, and not misleading. You are responsible for complying
              with applicable real-estate, advertising, and disclosure laws, including any required
              regulatory registration or disclosures.
            </li>
            <li>
              Listings are subject to review and may be approved, rejected, edited for formatting, or
              removed at our discretion, including if they appear fraudulent, duplicated, or in breach
              of these Terms.
            </li>
            <li>
              You retain ownership of the content you submit and grant BayBayt a non-exclusive,
              royalty-free licence to host, display, and distribute it for the purpose of operating and
              promoting the Services.
            </li>
          </ul>
        </Section>

        <Section title="4. Prohibited activities">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Post false, fraudulent, duplicate, or misleading listings or information.</li>
            <li>Infringe the intellectual property, privacy, or other rights of any person.</li>
            <li>Harvest contact details or scrape the Services without our written permission.</li>
            <li>Upload malware or attempt to disrupt, overload, or gain unauthorised access to the Services.</li>
            <li>Use the Services for spam, harassment, or any unlawful purpose.</li>
          </ul>
        </Section>

        <Section title="5. Paid listing plans and payments">
          <p>
            Certain features and listing quotas are offered through paid plans. Prices and inclusions
            are shown at the point of purchase. Payments are processed by a third-party payment
            gateway, and by paying you also agree to that provider&rsquo;s terms. Unless stated
            otherwise or required by law, payments for listing plans are non-refundable once the
            benefit (such as a listing credit) has been made available to your account.
          </p>
        </Section>

        <Section title="6. AI valuation and tools">
          <p>
            Tools such as AI property valuation and the loan EMI calculator provide automated
            estimates for general guidance only. They are not an appraisal, financial advice, or an
            offer, and they may be inaccurate. You should obtain independent professional advice before
            relying on them for any decision.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p>
            The Services, including the BayBayt name, logo, design, and software, are owned by BayBayt
            and protected by applicable laws. Except for content you submit, you may not copy, modify,
            distribute, or create derivative works from any part of the Services without our prior
            written consent.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p>
            The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
            without warranties of any kind, whether express or implied. We do not warrant that
            listings are accurate, complete, current, or genuine, that any property is available or
            fit for a particular purpose, or that the Services will be uninterrupted or error-free. You
            use the Services and deal with other users at your own risk and should independently verify
            all property, title, and legal details.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the maximum extent permitted by law, BayBayt and its officers, employees, and partners
            will not be liable for any indirect, incidental, special, consequential, or punitive
            damages, or for any loss arising out of dealings between users or reliance on any listing or
            tool. Our total liability for any claim relating to the Services will not exceed the amount
            you paid to us, if any, in the twelve months before the claim arose.
          </p>
        </Section>

        <Section title="10. Indemnity">
          <p>
            You agree to indemnify and hold BayBayt harmless from any claims, damages, losses, and
            expenses (including reasonable legal fees) arising from your use of the Services, your
            content, or your breach of these Terms or of any law or third-party right.
          </p>
        </Section>

        <Section title="11. Suspension and termination">
          <p>
            We may suspend or terminate your access to the Services, or remove your listings, at any
            time if you breach these Terms or if we reasonably believe it is necessary to protect the
            Services or other users. You may stop using the Services and request account deletion at any
            time.
          </p>
        </Section>

        <Section title="12. Governing law and disputes">
          <p>
            These Terms are governed by the laws of India, and the courts at our principal place of
            business will have exclusive jurisdiction over any dispute, subject to any mandatory
            consumer-protection rights available to you.
          </p>
        </Section>

        <Section title="13. Changes to these Terms">
          <p>
            We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
            updated&rdquo; date above. Continued use of the Services after an update means you accept
            the revised Terms.
          </p>
        </Section>

        <Section title="14. Contact us">
          <p>
            Questions about these Terms? Email us at{' '}
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
          <Link href="/privacy-policy" className="text-[#18A67D] font-semibold hover:underline">
            Privacy Policy
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
