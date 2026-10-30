import { cookies, headers } from 'next/headers';
import { cityNameFromGeoHeaders } from '@/lib/geoCity';
import { BrowseByCitySection } from '@/components/seo/BrowseByCitySection';
import HomeClient from './HomeClient';

// Resolve the initial city on the SERVER so the first paint already shows the
// right city — no client-side detection swap, hence no layout shift (CLS).
// Priority: the user's saved `bb_city` cookie → Vercel edge geo headers →
// Bangalore default. Reading cookies/headers opts this route into dynamic
// rendering, which is what we want for per-request geo personalization.
async function resolveInitialCity(): Promise<string> {
  const cookieStore = await cookies();
  const saved = cookieStore.get('bb_city')?.value;
  if (saved) return saved;

  const h = await headers();
  const fromGeo = cityNameFromGeoHeaders((name) => h.get(name));
  return fromGeo || 'Bangalore';
}

export default async function Page() {
  const initialCityName = await resolveInitialCity();
  // Pass the city links as a server-rendered node so they land in the SSR HTML
  // (crawlable), bridging the homepage to the SEO city landing pages.
  return (
    <HomeClient initialCityName={initialCityName} cityLinks={<BrowseByCitySection />} />
  );
}
