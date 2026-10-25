import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, ShieldCheck, BedDouble, Maximize2, ArrowRight, Building2 } from 'lucide-react';
import {
  getIndexableCities,
  resolveCitySlug,
  getCityProperties,
  cityToSlug,
} from '@/lib/cityLoader';
import { getSiteUrl } from '@/lib/siteUrl';
import { propertyDescriptor, propertyImageAlt, dealPhrase } from '@/lib/seoText';
import { resolveCityInfo } from '@/lib/realEstateData';
import { availableTypes } from '@/lib/seoLandings';
import {
  JsonLd,
  cityCollectionJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from '@/components/seo/JsonLd';
import { BrandLogo } from '@/components/BrandLogo';
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

function topLocalities(properties: Property[], limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const p of properties) {
    const loc = (p.locality || '').trim();
    if (loc) counts.set(loc, (counts.get(loc) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name]) => name);
}

function distinctCategories(properties: Property[]): string[] {
  return [...new Set(properties.map((p) => p.category).filter(Boolean))];
}

function buildFaqs(city: string, properties: Property[]) {
  const { forSale, forRent } = splitByDeal(properties);
  const localities = topLocalities(properties, 6);
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
    faqs.push({
      question: `Which localities in ${city} have properties on BayBayt?`,
      answer: `Listings are currently available in ${localities.join(', ')}${localities.length >= 6 ? ' and more' : ''}.`,
    });
  }
  if (categories.length) {
    faqs.push({
      question: `What types of properties are listed in ${city}?`,
      answer: `You can find ${categories.join(', ')} in ${city} on BayBayt.`,
    });
  }
  return faqs;
}

// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await resolveCitySlug(slug);
  if (!city) return { title: 'City not found', robots: { index: false, follow: true } };

  const title = `Property for Sale & Rent in ${city}`;
  const description = `Browse verified, owner-direct properties for sale and rent in ${city} on BayBayt — flats, villas, plots and commercial spaces with zero brokerage.`;
  const canonical = `/properties/in/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
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
  const localities = topLocalities(properties);
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

      {/* Lightweight header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="BayBayt home">
            <BrandLogo className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-[#334155]">
            <Link href="/properties" className="hover:text-[#0F2A43]">All Properties</Link>
            <Link href="/projects" className="hover:text-[#0F2A43] hidden sm:inline">Projects</Link>
            <Link href="/post-property" className="px-3 py-1.5 rounded-lg bg-[#18A67D] text-white hover:bg-[#148a67]">
              Post Property
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#64748B] mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/properties" className="hover:underline">Properties</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#334155] font-medium">{city}</span>
        </nav>

        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43] tracking-tight">
            Property for Sale &amp; Rent in {city}
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-[#475569] leading-relaxed">
            {description} {info.state ? `${city} is in ${info.state}. ` : ''}
            Every listing is posted directly by the owner and verified — no brokerage, no middlemen.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7F2] text-[#148a67] font-semibold">
              <ShieldCheck className="w-4 h-4" /> {properties.length} verified {properties.length === 1 ? 'listing' : 'listings'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155]">{forSale} for sale</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155]">{forRent} for rent</span>
            <Link
              href={`/properties?city=${encodeURIComponent(city)}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F2A43] text-white font-semibold hover:bg-[#143654]"
            >
              Search &amp; filter all {city} listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Popular localities */}
        {localities.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[#0F2A43] mb-3">Popular localities in {city}</h2>
            <div className="flex flex-wrap gap-2">
              {localities.map((loc) => (
                <Link
                  key={loc}
                  href={`/properties/in/${slug}/${cityToSlug(loc)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#334155] hover:border-[#18A67D] hover:text-[#148a67]"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" /> {loc}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by property type */}
        {types.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[#0F2A43] mb-3">Browse {city} property by type</h2>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <Link
                  key={t.def.slug}
                  href={`/properties/in/${slug}/${t.def.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#334155] hover:border-[#18A67D] hover:text-[#148a67]"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" /> {t.def.label}
                  <span className="text-[#94A3B8]">({t.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Listing grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#0F2A43] mb-4">Latest properties in {city}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.slice(0, 24).map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={p.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'}
                    alt={propertyImageAlt(p)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 left-2 bg-[#0F2A43]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {p.category} · {dealPhrase(p)}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-base font-extrabold text-[#0F2A43]">{p.priceFormatted}</div>
                  <h3 className="mt-1 text-sm font-semibold text-[#1E293B] line-clamp-1">{propertyDescriptor(p)}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#64748B]">
                    <MapPin className="w-3.5 h-3.5" /> {[p.locality, p.city].filter(Boolean).join(', ')}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#475569]">
                    {p.bhk ? <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bhk} BHK</span> : null}
                    {p.carpetAreaSqFt ? <span className="inline-flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" /> {p.carpetAreaSqFt} sq.ft</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {properties.length > 24 && (
            <div className="mt-6 text-center">
              <Link
                href={`/properties?city=${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#18A67D] text-white font-semibold hover:bg-[#148a67]"
              >
                View all {properties.length} properties in {city} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* FAQ (AEO) */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-[#0F2A43] mb-4">Frequently asked questions about {city} real estate</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.question} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="text-sm font-semibold text-[#0F2A43]">{f.question}</h3>
                <p className="mt-1.5 text-sm text-[#475569] leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
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
