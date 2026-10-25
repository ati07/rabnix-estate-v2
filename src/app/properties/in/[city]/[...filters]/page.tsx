import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, ShieldCheck, BedDouble, Maximize2, ArrowRight, Building2 } from 'lucide-react';
import {
  getIndexableCities,
  resolveCitySlug,
  getCityProperties,
} from '@/lib/cityLoader';
import {
  resolveLanding,
  availableLocalities,
  availableTypes,
  singleSegmentPaths,
  type Resolved,
} from '@/lib/seoLandings';
import { getSiteUrl } from '@/lib/siteUrl';
import { propertyDescriptor, propertyImageAlt, dealPhrase } from '@/lib/seoText';
import {
  JsonLd,
  landingCollectionJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from '@/components/seo/JsonLd';
import { BrandLogo } from '@/components/BrandLogo';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
// Matches the city page: inventory shifts as listings are approved; hourly ISR
// keeps pages fresh without a rebuild. Two-segment combos render on demand.
export const revalidate = 3600;

type Params = { params: Promise<{ city: string; filters: string[] }> };

// Pre-render single-segment landing pages (localities + type tokens) that have
// inventory, per city. Deeper combos fall back to on-demand ISR.
export async function generateStaticParams() {
  const cities = await getIndexableCities();
  const out: Array<{ city: string; filters: string[] }> = [];
  for (const c of cities) {
    try {
      const properties = await getCityProperties(c.name);
      for (const seg of singleSegmentPaths(properties)) {
        out.push({ city: c.slug, filters: [seg] });
      }
    } catch {
      // Skip a city that fails to load; never fail the whole build.
    }
  }
  return out;
}

// ---- headline / copy derivations -------------------------------------------

function headline(r: Resolved, city: string): string {
  switch (r.kind) {
    case 'type':
      return `${r.type.label} in ${city}`;
    case 'locality':
      return `Property for Sale & Rent in ${r.locality.name}, ${city}`;
    case 'locality-type':
      return `${r.type.label} in ${r.locality.name}, ${city}`;
  }
}

function describe(r: Resolved, city: string): string {
  const n = r.properties.length;
  const noun = n === 1 ? 'property' : 'properties';
  switch (r.kind) {
    case 'type':
      return `Browse ${n} verified, owner-direct ${r.type.label.toLowerCase()} in ${city} on BayBayt — zero brokerage.`;
    case 'locality':
      return `Browse ${n} verified, owner-direct ${noun} in ${r.locality.name}, ${city} on BayBayt — zero brokerage.`;
    case 'locality-type':
      return `Browse ${n} verified ${r.type.label.toLowerCase()} in ${r.locality.name}, ${city} on BayBayt — posted directly by owners, zero brokerage.`;
  }
}

function canonicalPath(citySlug: string, filters: string[]): string {
  return `/properties/in/${citySlug}/${filters.join('/')}`;
}

function buildFaqs(r: Resolved, city: string): { question: string; answer: string }[] {
  const n = r.properties.length;
  const what = r.kind === 'locality' ? `properties` : r.type.label.toLowerCase();
  const where = r.kind === 'type' ? city : `${r.locality.name}, ${city}`;
  const forSale = r.properties.filter((p) => dealPhrase(p) === 'for Sale').length;
  const forRent = r.properties.filter((p) => dealPhrase(p) === 'for Rent').length;

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How many ${what} are available in ${where} on BayBayt?`,
      answer: `There ${n === 1 ? 'is' : 'are'} ${n} verified ${n === 1 ? 'listing' : 'listings'} in ${where} on BayBayt — ${forSale} for sale and ${forRent} for rent, posted directly by owners.`,
    },
    {
      question: `Is there any brokerage on these listings?`,
      answer: `No. BayBayt lists owner-direct properties in ${where}, so you connect with owners without paying brokerage.`,
    },
  ];
  return faqs;
}

// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city: slug, filters } = await params;
  const city = await resolveCitySlug(slug);
  if (!city) return { title: 'Not found', robots: { index: false, follow: true } };

  const properties = await getCityProperties(city);
  const resolved = resolveLanding(properties, filters);
  if (!resolved) return { title: 'Not found', robots: { index: false, follow: true } };

  const title = headline(resolved, city);
  const description = describe(resolved, city);
  const canonical = canonicalPath(slug, filters);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'website', url: canonical },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function LandingPage({ params }: Params) {
  const { city: slug, filters } = await params;
  const city = await resolveCitySlug(slug);
  if (!city) notFound();

  const allProperties = await getCityProperties(city);
  const resolved = resolveLanding(allProperties, filters);
  if (!resolved) notFound();

  const base = getSiteUrl();
  const properties = resolved.properties;
  const canonical = canonicalPath(slug, filters);
  const title = headline(resolved, city);
  const description = describe(resolved, city);
  const faqs = buildFaqs(resolved, city);

  const forSale = properties.filter((p) => dealPhrase(p) === 'for Sale').length;
  const forRent = properties.filter((p) => dealPhrase(p) === 'for Rent').length;

  // Cross-links. On a locality page, offer the property types within it; on a
  // type page, offer localities carrying that type; always link related pages.
  const otherLocalities = availableLocalities(allProperties)
    .filter((l) => (resolved.locality ? l.slug !== resolved.locality.slug : true))
    .slice(0, 12);
  const otherTypes = availableTypes(allProperties)
    .filter((t) => (resolved.type ? t.def.slug !== resolved.type.slug : true))
    .slice(0, 10);

  // Breadcrumb trail reflecting the active drill-down.
  const crumbs: { name: string; path: string }[] = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: city, path: `/properties/in/${slug}` },
  ];
  if (resolved.kind === 'locality') {
    crumbs.push({ name: resolved.locality.name, path: canonical });
  } else if (resolved.kind === 'type') {
    crumbs.push({ name: resolved.type.label, path: canonical });
  } else {
    crumbs.push({ name: resolved.locality.name, path: `/properties/in/${slug}/${resolved.locality.slug}` });
    crumbs.push({ name: resolved.type.label, path: canonical });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <JsonLd
        data={[
          landingCollectionJsonLd(base, {
            url: `${base}${canonical}`,
            name: title,
            description,
            about: resolved.locality ? resolved.locality.name : city,
            properties,
          }),
          breadcrumbJsonLd(base, crumbs),
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
        <nav className="text-xs text-[#64748B] mb-4 flex flex-wrap items-center" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.path} className="inline-flex items-center">
              {i > 0 && <span className="mx-1.5">/</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.path} className="hover:underline">{c.name}</Link>
              ) : (
                <span className="text-[#334155] font-medium">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43] tracking-tight">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-[#475569] leading-relaxed">
            {description} Every listing is posted directly by the owner and verified — no brokerage, no middlemen.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7F2] text-[#148a67] font-semibold">
              <ShieldCheck className="w-4 h-4" /> {properties.length} verified {properties.length === 1 ? 'listing' : 'listings'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155]">{forSale} for sale</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#334155]">{forRent} for rent</span>
            <Link
              href={`/properties/in/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F2A43] text-white font-semibold hover:bg-[#143654]"
            >
              All {city} listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Browse by property type */}
        {otherTypes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[#0F2A43] mb-3">
              {resolved.locality ? `Property types in ${resolved.locality.name}` : `Property types in ${city}`}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherTypes.map((t) => (
                <Link
                  key={t.def.slug}
                  href={
                    resolved.locality
                      ? `/properties/in/${slug}/${resolved.locality.slug}/${t.def.slug}`
                      : `/properties/in/${slug}/${t.def.slug}`
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#334155] hover:border-[#18A67D] hover:text-[#148a67]"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" /> {t.def.label}
                  <span className="text-[#94A3B8]">({t.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by locality */}
        {otherLocalities.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[#0F2A43] mb-3">
              {resolved.type ? `${resolved.type.label} by locality in ${city}` : `Other localities in ${city}`}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherLocalities.map((l) => (
                <Link
                  key={l.slug}
                  href={
                    resolved.type
                      ? `/properties/in/${slug}/${l.slug}/${resolved.type.slug}`
                      : `/properties/in/${slug}/${l.slug}`
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-sm text-[#334155] hover:border-[#18A67D] hover:text-[#148a67]"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" /> {l.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Listing grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#0F2A43] mb-4">{title}</h2>
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
        </section>

        {/* FAQ (AEO) */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-[#0F2A43] mb-4">Frequently asked questions</h2>
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
