import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/authContext';
import { PropertyProvider } from '@/lib/propertyContext';
import { GenieProvider } from '@/lib/genieContext';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/seo/JsonLd';

// Canonical base URL; resolves relative OG/Twitter image paths into absolute
// URLs and anchors every page's canonical link. See src/lib/siteUrl.ts.
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BayBayt - Buy, Rent, PG & AI Property Valuation',
    template: '%s | BayBayt',
  },
  description: 'India’s premier real estate platform by BayBayt for buying, selling, and renting properties with verified owner-direct listings and AI valuation.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  // Google Search Console domain/URL-prefix verification. Next.js renders this
  // as <meta name="google-site-verification"> in every page's <head>.
  verification: {
    google: 'XKAl5bom-d9e9RqIynlnnbdI89gjEZz_MCtb-vaKfsI',
  },
  openGraph: {
    // Images intentionally omitted: the branded card from
    // src/app/opengraph-image.tsx is auto-applied as the default og:image.
    title: 'BayBayt - India Real Estate Platform',
    description: 'Find homes, commercial properties, and lands with AI valuation on BayBayt.',
    type: 'website',
    siteName: 'BayBayt',
    url: '/',
    locale: 'en_IN',
  },
  twitter: {
    // twitter:image falls back to the opengraph-image card automatically.
    card: 'summary_large_image',
    title: 'BayBayt - India Real Estate Platform',
    description: 'Find homes, commercial properties, and lands with AI valuation on BayBayt.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Sitewide structured data — resolves BayBayt as one entity (SEO/AEO)
            and offers Google a sitelinks search box. */}
        <JsonLd data={[organizationJsonLd(siteUrl), websiteJsonLd(siteUrl)]} />
        <AuthProvider>
          <PropertyProvider>
            <GenieProvider>
              {children}
            </GenieProvider>
          </PropertyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
