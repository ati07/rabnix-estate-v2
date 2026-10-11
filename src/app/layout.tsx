import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/authContext';
import { PropertyProvider } from '@/lib/propertyContext';

// Base URL used to resolve relative OG/Twitter image paths into absolute URLs.
// Sourced from the environment: set NEXT_PUBLIC_SITE_URL to your canonical
// domain in production. Falls back to Vercel's auto-injected deployment URL,
// then to localhost for local development.
const siteUrl =
  process.env.SITE_URL ||
  (process.env.SITE_URL
    ? `https://${process.env.SITE_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'BayBayt - Buy, Rent, PG & AI Property Valuation',
  description: 'India’s premier real estate platform by BayBayt for buying, selling, and renting properties with verified owner-direct listings and AI valuation.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'BayBayt - India Real Estate Platform',
    description: 'Find homes, commercial properties, and lands with AI valuation on BayBayt.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BayBayt - India Real Estate Platform',
    description: 'Find homes, commercial properties, and lands with AI valuation on BayBayt.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <PropertyProvider>
            {children}
          </PropertyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
