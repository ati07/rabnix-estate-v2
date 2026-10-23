import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyForPage, getVerifiedPropertyIds } from '@/lib/propertyLoader';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, propertyJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import PropertyDetailsClient from './PropertyDetailsClient';

export const runtime = 'nodejs';
// Listings change (price drops, status, media); revalidate hourly rather than
// rendering purely dynamically so the common case is served from cache.
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

// Pre-render approved listings at build time; unknown ids are still rendered
// on-demand and cached (dynamicParams defaults to true).
export async function generateStaticParams() {
  const ids = await getVerifiedPropertyIds();
  return ids.map((id) => ({ id }));
}

// Per-listing title/description/canonical/OG — replaces the generic root
// metadata that every property page used to inherit.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyForPage(id);
  if (!property) {
    return { title: 'Property not found' };
  }

  const location = [property.locality, property.city].filter(Boolean).join(', ');
  const title = `${property.title} — ${property.priceFormatted}${location ? ` in ${location}` : ''}`;
  const description = (property.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || `${property.title} in ${location}. View photos, price, and details on BayBayt.`;
  const canonical = `/properties/${property.id}`;
  // Only approved listings are indexable; pending/rejected ones stay viewable
  // (owner/admin) but must not surface in search.
  const indexable = property.verificationStatus === 'approved';

  return {
    title,
    description,
    alternates: { canonical },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(property.images?.[0] ? { images: [property.images[0]] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(property.images?.[0] ? { images: [property.images[0]] } : {}),
    },
  };
}

export default async function PropertyDetailsPage({ params }: Params) {
  const { id } = await params;
  const property = await getPropertyForPage(id);
  if (!property) notFound();

  const base = getSiteUrl();

  return (
    <>
      <JsonLd
        data={[
          propertyJsonLd(property, base),
          breadcrumbJsonLd(base, [
            { name: 'Home', path: '/' },
            { name: 'Properties', path: '/properties' },
            { name: property.title, path: `/properties/${property.id}` },
          ]),
        ]}
      />
      <PropertyDetailsClient id={id} initialProperty={property} />
    </>
  );
}
