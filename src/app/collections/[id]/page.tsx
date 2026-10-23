import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollectionForPage } from '@/lib/seoLoaders';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, collectionPageJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import CollectionDetailsClient from './CollectionDetailsClient';

export const runtime = 'nodejs';
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const data = await getCollectionForPage(id);
  if (!data) return { title: 'Collection not found' };
  const { collection } = data;

  const title = `${collection.title}${collection.subtitle ? ` — ${collection.subtitle}` : ''}`;
  const description = (collection.overview || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || `${collection.title} — a curated collection of verified listings on BayBayt.`;
  const canonical = `/collections/${collection.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(collection.heroImage ? { images: [collection.heroImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(collection.heroImage ? { images: [collection.heroImage] } : {}),
    },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { id } = await params;
  const data = await getCollectionForPage(id);
  if (!data) notFound();

  const base = getSiteUrl();
  const { collection } = data;
  const faqs = (collection.faqs || []).filter((f) => f.question && f.answer);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(collection, base),
          breadcrumbJsonLd(base, [
            { name: 'Home', path: '/' },
            { name: 'Collections', path: '/collections' },
            { name: collection.title, path: `/collections/${collection.id}` },
          ]),
          // AEO: surface the collection's genuine Q&A as FAQPage structured data.
          ...(faqs.length ? [faqJsonLd(faqs)] : []),
        ]}
      />
      <CollectionDetailsClient id={id} initialCollection={collection} initialProperties={data.properties} />
    </>
  );
}
