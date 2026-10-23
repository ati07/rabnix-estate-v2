import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBuilderForPage } from '@/lib/seoLoaders';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, builderJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import BuilderDetailsClient from './BuilderDetailsClient';

export const runtime = 'nodejs';
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const builder = await getBuilderForPage(id);
  if (!builder) return { title: 'Builder not found' };

  const title = `${builder.name}${builder.headquarters ? ` — ${builder.headquarters}` : ''}`;
  const description = (builder.about || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || `${builder.name} — projects, RERA details, and track record on BayBayt.`;
  const canonical = `/builders/${builder.slug || builder.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(builder.logo ? { images: [builder.logo] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(builder.logo ? { images: [builder.logo] } : {}),
    },
  };
}

export default async function BuilderProfilePage({ params }: Params) {
  const { id } = await params;
  const builder = await getBuilderForPage(id);
  if (!builder) notFound();

  const base = getSiteUrl();

  return (
    <>
      <JsonLd
        data={[
          builderJsonLd(builder, base),
          breadcrumbJsonLd(base, [
            { name: 'Home', path: '/' },
            { name: 'Builders', path: '/builders' },
            { name: builder.name, path: `/builders/${builder.slug || builder.id}` },
          ]),
        ]}
      />
      <BuilderDetailsClient id={id} initialBuilder={builder} />
    </>
  );
}
