import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ShieldCheck, Building2, ChevronDown, HelpCircle } from 'lucide-react';
import {
  getIndexableCities,
  resolveCitySlug,
  getCityProperties,
} from '@/lib/cityLoader';
import { getSiteUrl } from '@/lib/siteUrl';
import { dealPhrase } from '@/lib/seoText';
import { resolveCityInfo } from '@/lib/realEstateData';
import { availableTypes, availableLocalities, isIndexableLanding } from '@/lib/seoLandings';
import {
  JsonLd,
  cityCollectionJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from '@/components/seo/JsonLd';
import { BrandLogo } from '@/components/BrandLogo';
import { PropertyCatalog } from '@/components/PropertyCatalog';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
// City inventory shifts as listings are posted/approved; hourly ISR keeps the
// page fresh without rebuilding, while serving the common case from cache.
export const revalidate = 3600;

type Params = { params: Promise<{ city: string }> };

// Pre-render every city that has approved inventory; unknown slugs 404.
export async function generateStaticParams() {
  const cities = await getIndexableCities();
  return cities.map((c) => ({ city: c.slug }));
}

// ---- small, truthful derivations from the real listing set -----------------

function splitByDeal(properties: Property[]) {
  let forSale = 0;
  let forRent = 0;
  for (const p of properties) {
    if (dealPhrase(p) === 'for Rent') forRent++;
    else forSale++;
  }
  return { forSale, forRent };
}

function distinctCategories(properties: Property[]): string[] {
  return [...new Set(properties.map((p) => p.category).filter(Boolean))];
}

// Plural, lower-case category labels for prose (FAQ answers).
const CATEGORY_PLURAL: Record<string, string> = {
  Apartment: 'apartments',
  Villa: 'villas',
  'Residential Plot': 'residential plots',
  'Commercial Land': 'commercial land',
  'PG / Co-Living': 'PG & co-living spaces',
  'Builder Floor': 'builder floors',
  Studio: 'studio apartments',
  Penthouse: 'penthouses',
  'Commercial Office': 'office spaces',
  'Retail Shop': 'shops',
  Warehouse: 'warehouses',
};
function pluralCategory(c: string): string {
  return CATEGORY_PLURAL[c] || c.toLowerCase();
}

// "A", "A and B", "A, B and C" — a natural-language list.
function naturalList(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function buildFaqs(city: string, properties: Property[]) {
  const { forSale, forRent } = splitByDeal(properties);
  const allLocalities = availableLocalities(properties);
  const localities = allLocalities.slice(0, 6).map((l) => l.name);
  const categories = distinctCategories(properties);
  const faqs: { question: string; answer: string }[] = [
    {
      question: `How many properties are available in ${city} on BayBayt?`,
      answer: `There are ${properties.length} verified ${properties.length === 1 ? 'listing' : 'listings'} in ${city} on BayBayt — ${forSale} for sale and ${forRent} for rent, posted directly by owners.`,
    },
    {
      question: `Is there any brokerage on BayBayt listings in ${city}?`,
      answer: `No. BayBayt lists owner-direct properties in ${city}, so you connect with owners without paying brokerage.`,
    },
  ];
  if (localities.length) {
    const hasMore = allLocalities.length > localities.length;
    // With an "and more" tail, a plain comma list reads better than a natural
    // "… and X" (which would collide into "… and X and more").
    const localityText = hasMore ? `${localities.join(', ')} and more` : naturalList(localities);
    faqs.push({
      question: `Which localities in ${city} have properties on BayBayt?`,
      answer: `Listings are currently available in ${localityText}.`,
    });
  }
  if (categories.length) {
    faqs.push({
      question: `What types of properties are listed in ${city}?`,
      answer: `You can find ${naturalList(categories.map(pluralCategory))} in ${city} on BayBayt.`,
    });
  }
  return faqs;
}

// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city: slug } = await params;
  const cities = await getIndexableCities();
  const match = cities.find((c) => c.slug === slug);
  if (!match) return { title: 'City not found', robots: { index: false, follow: true } };
  const city = match.name;

  const title = `Property for Sale & Rent in ${city}`;
  const description = `Browse verified, owner-direct properties for sale and rent in ${city} on BayBayt — flats, villas, plots and commercial spaces with zero brokerage.`;
  const canonical = `/properties/in/${slug}`;
  // Keep a near-empty city page out of the index until it has real depth.
  const index = isIndexableLanding(match.count);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index, follow: true },
    openGraph: { title, description, type: 'website', url: canonical },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CityLandingPage({ params }: Params) {
  const { city: slug } = await params;
  const city = await resolveCitySlug(slug);
  if (!city) notFound();

  const properties = await getCityProperties(city);
  const base = getSiteUrl();
  const info = resolveCityInfo(city);

  const { forSale, forRent } = splitByDeal(properties);
  const localities = availableLocalities(properties).slice(0, 12);
  const types = availableTypes(properties).slice(0, 12);
  const faqs = buildFaqs(city, properties);

  const title = `Property for Sale & Rent in ${city}`;
  const description = `Browse ${properties.length} verified, owner-direct ${properties.length === 1 ? 'property' : 'properties'} for sale and rent in ${city} on BayBayt — zero brokerage.`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <JsonLd
        data={[
          cityCollectionJsonLd(base, { city, slug, title, description, properties }),
          breadcrumbJsonLd(base, [
            { name: 'Home', path: '/' },
            { name: 'Properties', path: '/properties' },
            { name: city, path: `/properties/in/${slug}` },
          ]),
          faqJsonLd(faqs),
        ]}
      />

      {/* Top header — matches the /properties catalog */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group select-none" aria-label="BayBayt home">
            <BrandLogo variant="onLight" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              My Dashboard
            </Link>
            <Link
              href="/post-property"
              className="px-3.5 py-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              + Post Property Free
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb + title banner — matches the /properties catalog */}
      <div className="bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#0F2A43] transition-colors">Home</Link>
            <span className="text-[#94A3B8]">/</span>
            <Link href="/properties" className="hover:text-[#0F2A43] transition-colors">Properties</Link>
            <span className="text-[#94A3B8]">/</span>
            <span className="text-[#0F2A43] font-bold">{city}</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F2A43] tracking-tight">
            Property for Sale &amp; Rent in {city}
            <span className="text-sm font-normal text-[#64748B] ml-2">
              ({properties.length} verified {properties.length === 1 ? 'listing' : 'listings'})
            </span>
          </h1>
          <p className="mt-2 max-w-3xl text-xs sm:text-sm text-[#475569] leading-relaxed">
            {description} {info.state ? `${city} is in ${info.state}. ` : ''}
            Every listing is posted directly by the owner and verified — no brokerage, no middlemen.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7F2] text-[#148a67] font-semibold">
              <ShieldCheck className="w-4 h-4" /> {properties.length} verified {properties.length === 1 ? 'listing' : 'listings'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155] font-semibold">{forSale} for sale</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155] font-semibold">{forRent} for rent</span>
          </div>
        </div>
      </div>

      <main>
        {/* Interactive catalog — the shared /properties filter UI, server-seeded
            with this city's listings so they sit in the crawlable HTML (indexable)
            and the city is locked (no city selector). */}
        <PropertyCatalog properties={properties} lockedCity={city} />

        {/* SEO cross-link sections + FAQ keep their own padded container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Popular localities */}
        {localities.length > 0 && (
          <section className="mt-10 pt-8 border-t border-[#E2E8F0] mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#18A67D]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">Popular localities in {city}</h2>
                <p className="text-xs text-[#64748B]">Browse owner-direct listings by neighbourhood</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {localities.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/properties/in/${slug}/${loc.slug}`}
                  className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-md transition-all"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#94A3B8] group-hover:text-[#18A67D] shrink-0 transition-colors" />
                    <span className="text-sm font-bold text-[#0F2A43] truncate">{loc.name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-[#148a67] bg-[#EAF7F2] px-2 py-0.5 rounded-full">{loc.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by property type */}
        {types.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#18A67D]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">Browse {city} property by type</h2>
                <p className="text-xs text-[#64748B]">Jump straight to the home type you want</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {types.map((t) => (
                <Link
                  key={t.def.slug}
                  href={`/properties/in/${slug}/${t.def.slug}`}
                  className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-md transition-all"
                >
                  <span className="text-sm font-bold text-[#0F2A43] truncate group-hover:text-[#148a67] transition-colors">{t.def.label}</span>
                  <span className="shrink-0 text-[11px] font-bold text-[#148a67] bg-[#EAF7F2] px-2 py-0.5 rounded-full">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ (AEO) — accordion; answers stay in the HTML (crawlable) even when collapsed */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-[#18A67D]" />
            </div>
            <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">
              Frequently asked questions about {city} real estate
            </h2>
          </div>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <details
                key={f.question}
                open={i === 0}
                className="group bg-white rounded-xl border border-[#E2E8F0] open:border-[#18A67D]/40 open:shadow-sm transition-all"
              >
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-sm font-bold text-[#0F2A43]">{f.question}</h3>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-[#18A67D]" />
                </summary>
                <p className="px-4 pb-4 text-sm text-[#475569] leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
        </div>
      </main>

      <footer className="bg-[#0F2A43] text-slate-300 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="onDark" className="h-8 w-auto" />
          <p>Owner-direct, verified property listings across India — zero brokerage.</p>
        </div>
      </footer>
    </div>
  );
}
