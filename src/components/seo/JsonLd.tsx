import type { Property } from '@/lib/types';
import type { FeaturedProjectItem, PreferredAgentItem } from '@/lib/homeSectionsData';
import type { Builder } from '@/lib/buildersData';
import type { CuratedCollection } from '@/lib/collectionsData';

/**
 * Structured data (schema.org JSON-LD) for SEO rich results and AEO — the facts
 * AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) read to
 * cite BayBayt. Render <JsonLd data={...}> anywhere; pass a single object or an
 * array of nodes.
 *
 * ANTI-SCRAPING: no owner/agent phone number appears in any builder below. The
 * Property shape handed to these builders already has `postedBy.phone`
 * withheld (serializeProperty(p, false) / propertyLoader), but we also never
 * reference it here.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}

/** Make a site-relative path absolute against the canonical base. */
function absolute(base: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** The BayBayt entity — one consistent Organization node across the site so
 * search and AI engines resolve "BayBayt" as a single entity. */
export function organizationJsonLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: 'BayBayt',
    url: base,
    logo: absolute(base, '/logo.png'),
    description:
      'India’s real estate platform for buying, selling, and renting verified owner-direct properties, with AI property valuation.',
    areaServed: 'IN',
  };
}

/** The site itself, with a SearchAction so Google can show a sitelinks search box. */
export function websiteJsonLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: 'BayBayt',
    url: base,
    publisher: { '@id': `${base}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/properties?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** A single property listing. Emits RealEstateListing with a nested Residence
 * (rooms, bathrooms, floor size, address) and an Offer (price in INR). */
export function propertyJsonLd(p: Property, base: string) {
  const url = `${base}/properties/${p.id}`;
  const images = (p.images || []).map((img) => absolute(base, img));

  const residence: Record<string, unknown> = {
    '@type': ['Residence', 'Accommodation'],
    name: p.title,
    numberOfBathroomsTotal: p.bathrooms,
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.address || p.locality,
      addressLocality: p.locality,
      addressRegion: p.state || p.city,
      addressCountry: p.country || 'IN',
    },
  };
  if (p.bhk) residence.numberOfRooms = p.bhk;
  if (p.carpetAreaSqFt) {
    residence.floorSize = { '@type': 'QuantitativeValue', value: p.carpetAreaSqFt, unitCode: 'FTK' };
  }
  if (p.coordinates) {
    residence.geo = { '@type': 'GeoCoordinates', latitude: p.coordinates.lat, longitude: p.coordinates.lng };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    url,
    name: p.title,
    description: p.description,
    ...(images.length ? { image: images } : {}),
    datePosted: p.createdAt,
    mainEntity: residence,
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

/** A breadcrumb trail. `items` are {name, path} in order from Home to the page. */
export function breadcrumbJsonLd(base: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absolute(base, it.path),
    })),
  };
}

/** A real-estate project/development. Emits an Apartment complex-style node
 * with its builder, location, and starting price as an Offer. */
export function projectJsonLd(p: FeaturedProjectItem, base: string) {
  const url = `${base}/projects/${p.id}`;
  const images = [p.image, ...(p.galleryImages || [])].filter(Boolean).map((img) => absolute(base, img));
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    url,
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(images.length ? { image: images } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.address || p.locality,
      addressLocality: p.locality,
      addressRegion: p.city,
      addressCountry: 'IN',
    },
  };
  if (p.builderName) {
    node.developer = { '@type': 'Organization', name: p.builderName };
  }
  if (typeof p.minPrice === 'number' && p.minPrice > 0) {
    node.offers = {
      '@type': 'Offer',
      price: p.minPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
    };
  }
  return node;
}

/** A builder/developer company page. */
export function builderJsonLd(b: Builder, base: string) {
  const url = `${base}/builders/${b.slug || b.id}`;
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    url,
    name: b.name,
    ...(b.logo ? { logo: absolute(base, b.logo) } : {}),
    ...(b.about ? { description: b.about } : {}),
    ...(b.headquarters ? { address: { '@type': 'PostalAddress', streetAddress: b.headquarters, addressCountry: 'IN' } } : {}),
    ...(b.website ? { sameAs: [b.website] } : {}),
  };
  return node;
}

/** A preferred agent's profile. RealEstateAgent — name, photo, area served.
 * No phone (contact reveal stays gated). */
export function agentJsonLd(a: PreferredAgentItem, base: string) {
  const url = `${base}/agents/${a.id}`;
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    url,
    name: a.name,
    ...(a.avatar ? { image: absolute(base, a.avatar) } : {}),
    ...(a.about ? { description: a.about } : {}),
    ...(a.agencyName ? { worksFor: { '@type': 'Organization', name: a.agencyName } } : {}),
    ...(a.city ? { areaServed: a.city } : {}),
  };
  return node;
}

/** A curated collection landing page. */
export function collectionPageJsonLd(c: CuratedCollection, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: `${base}/collections/${c.id}`,
    name: c.title,
    ...(c.subtitle ? { headline: c.subtitle } : {}),
    ...(c.overview ? { description: c.overview } : {}),
    ...(c.heroImage ? { image: absolute(base, c.heroImage) } : {}),
  };
}

/** FAQ structured data — an AEO lever: lets engines answer questions directly
 * with BayBayt's own copy. Pass genuine on-page Q&A only. */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
