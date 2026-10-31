import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ShieldCheck, ArrowRight, Building2, ChevronDown, HelpCircle } from 'lucide-react';
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
  isIndexableLanding,
  type Resolved,
} from '@/lib/seoLandings';
import { getSiteUrl } from '@/lib/siteUrl';
import { dealPhrase } from '@/lib/seoText';
import {
  JsonLd,
  landingCollectionJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from '@/components/seo/JsonLd';
import { BrandLogo } from '@/components/BrandLogo';
import { PropertyCatalog } from '@/components/PropertyCatalog';
import type { Property } from '@/lib/types';
import type { PropertyFilterState } from '@/lib/propertyFilters';

// Map a landing-page type slug to the catalog filter it represents, so the
// shared <PropertyCatalog> opens pre-set to this page's facet.
const TYPE_SLUG_TO_CATEGORY: Record<string, string> = {
  flats: 'Apartment',
  villas: 'Villa',
  'builder-floors': 'Builder Floor',
  'studio-apartments': 'Studio',
  penthouses: 'Penthouse',
  'office-space': 'Commercial Office',
  shops: 'Retail Shop',
  warehouses: 'Warehouse',
};
const COMMERCIAL_CATEGORIES = new Set(['Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land']);

function initialFiltersForLanding(r: Resolved): Partial<PropertyFilterState> {
  const f: Partial<PropertyFilterState> = {};
  if (r.locality) f.searchQuery = r.locality.name;

  const typeSlug = r.type?.slug;
  if (typeSlug) {
    if (typeSlug === 'for-sale') f.listingType = 'buy';
    else if (typeSlug === 'for-rent') f.listingType = 'rent';
    else if (typeSlug === 'pg') f.listingType = 'pg';
    else if (typeSlug === 'plots') f.listingType = 'plot';
    else if (typeSlug === 'commercial') f.listingType = 'commercial';
    else {
      const bhkFlats = typeSlug.match(/^(\d+)-bhk-flats$/);
      const bhkOnly = typeSlug.match(/^(\d+)-bhk$/);
      if (bhkFlats) {
        f.bhk = [parseInt(bhkFlats[1], 10)];
        f.categories = ['Apartment'];
      } else if (bhkOnly) {
        f.bhk = [parseInt(bhkOnly[1], 10)];
      } else {
        const cat = TYPE_SLUG_TO_CATEGORY[typeSlug];
        if (cat) {
          f.categories = [cat];
          if (COMMERCIAL_CATEGORIES.has(cat)) f.listingType = 'commercial';
        }
      }
    }
  }
  return f;
}

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
  // Thin pages stay crawlable (follow) but out of the index until they have
  // enough real inventory to be worth ranking.
  const index = isIndexableLanding(resolved.properties.length);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index, follow: true },
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#18A67D]" />
              </div>
              <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">
                {resolved.locality ? `Property types in ${resolved.locality.name}` : `Property types in ${city}`}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {otherTypes.map((t) => (
                <Link
                  key={t.def.slug}
                  href={
                    resolved.locality
                      ? `/properties/in/${slug}/${resolved.locality.slug}/${t.def.slug}`
                      : `/properties/in/${slug}/${t.def.slug}`
                  }
                  className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-md transition-all"
                >
                  <span className="text-sm font-bold text-[#0F2A43] truncate group-hover:text-[#148a67] transition-colors">{t.def.label}</span>
                  <span className="shrink-0 text-[11px] font-bold text-[#148a67] bg-[#EAF7F2] px-2 py-0.5 rounded-full">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by locality */}
        {otherLocalities.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#18A67D]" />
              </div>
              <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">
                {resolved.type ? `${resolved.type.label} by locality in ${city}` : `Other localities in ${city}`}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {otherLocalities.map((l) => (
                <Link
                  key={l.slug}
                  href={
                    resolved.type
                      ? `/properties/in/${slug}/${l.slug}/${resolved.type.slug}`
                      : `/properties/in/${slug}/${l.slug}`
                  }
                  className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-md transition-all"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#94A3B8] group-hover:text-[#18A67D] shrink-0 transition-colors" />
                    <span className="text-sm font-bold text-[#0F2A43] truncate">{l.name}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-[#148a67] bg-[#EAF7F2] px-2 py-0.5 rounded-full">{l.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Interactive catalog — the shared /properties filter UI, pre-set to this
          page's facet and server-seeded with the city's listings so matching
          cards sit in the crawlable HTML (indexable). City is locked. */}
      <PropertyCatalog
        properties={allProperties}
        lockedCity={city}
        initialFilters={initialFiltersForLanding(resolved)}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* FAQ (AEO) — accordion; answers stay in the HTML (crawlable) even when collapsed */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F2] flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-[#18A67D]" />
            </div>
            <h2 className="text-lg font-black text-[#0F2A43] tracking-tight leading-tight">Frequently asked questions</h2>
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

      <footer className="bg-[#0F2A43] text-slate-300 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="onDark" className="h-8 w-auto" />
          <p>Owner-direct, verified property listings across India — zero brokerage.</p>
        </div>
      </footer>
    </div>
  );
}
