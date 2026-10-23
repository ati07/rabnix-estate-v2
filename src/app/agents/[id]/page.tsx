import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAgentForPage } from '@/lib/seoLoaders';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, agentJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import AgentDetailsClient from './AgentDetailsClient';

export const runtime = 'nodejs';
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const data = await getAgentForPage(id);
  if (!data) return { title: 'Agent not found' };
  const { agent } = data;

  const title = `${agent.name}${agent.agencyName ? ` · ${agent.agencyName}` : ''}${agent.city ? ` — ${agent.city}` : ''}`;
  const description = (agent.about || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || `${agent.name}, a BayBayt preferred agent${agent.city ? ` in ${agent.city}` : ''}. View verified listings and get in touch.`;
  const canonical = `/agents/${agent.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: canonical,
      ...(agent.avatar ? { images: [agent.avatar] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(agent.avatar ? { images: [agent.avatar] } : {}),
    },
  };
}

export default async function AgentProfilePage({ params }: Params) {
  const { id } = await params;
  const data = await getAgentForPage(id);
  if (!data) notFound();

  const base = getSiteUrl();

  return (
    <>
      <JsonLd
        data={[
          agentJsonLd(data.agent, base),
          breadcrumbJsonLd(base, [
            { name: 'Home', path: '/' },
            { name: 'Agents', path: '/agents' },
            { name: data.agent.name, path: `/agents/${data.agent.id}` },
          ]),
        ]}
      />
      <AgentDetailsClient id={id} initialAgent={data.agent} initialProperties={data.properties} />
    </>
  );
}
