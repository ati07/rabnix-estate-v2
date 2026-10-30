import type { Metadata } from 'next';
import { BrowseByCitySection } from '@/components/seo/BrowseByCitySection';
import PropertiesListClient from './PropertiesListClient';

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent',
  description:
    'Browse verified, owner-direct homes, commercial spaces, and land for sale and rent across India on BayBayt. Filter by city, budget, BHK, and more.',
  alternates: { canonical: '/properties' },
};

// The catalog itself is client-rendered behind a useSearchParams Suspense, so a
// static shell only ever ships a spinner. Rendering dynamically guarantees the
// server-rendered "Browse by city" links below land in the crawlable HTML.
export const dynamic = 'force-dynamic';

export default function Page() {
  // The catalog itself is a client component behind Suspense; the city links
  // are server-rendered here so they always sit in the crawlable SSR HTML,
  // feeding internal link equity to the /properties/in/[city] landing pages.
  return (
    <>
      <PropertiesListClient />
      <BrowseByCitySection />
    </>
  );
}
