import type { Metadata } from 'next';
import { getProjectForPage, getApprovedProjectIds } from '@/lib/seoLoaders';
import { getSiteUrl } from '@/lib/siteUrl';
import { JsonLd, projectJsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import ProjectDetailsClient from './ProjectDetailsClient';

export const runtime = 'nodejs';
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

// Pre-render approved projects; others fall back to on-demand ISR.
export async function generateStaticParams() {
  const ids = await getApprovedProjectIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectForPage(id);
  if (!project) return { title: 'Project' };

  const location = [project.locality, project.city].filter(Boolean).join(', ');
  const title = `${project.name}${project.builderName ? ` by ${project.builderName}` : ''}${location ? ` — ${location}` : ''}`;
  const description = (project.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300) || `${project.name} in ${location}. Price, floor plans, amenities, and RERA details on BayBayt.`;
  const canonical = `/projects/${project.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(project.image ? { images: [project.image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(project.image ? { images: [project.image] } : {}),
    },
  };
}

export default async function ProjectDetailsPage({ params }: Params) {
  const { id } = await params;
  const project = await getProjectForPage(id);
  const base = getSiteUrl();

  return (
    <>
      {project && (
        <JsonLd
          data={[
            projectJsonLd(project, base),
            breadcrumbJsonLd(base, [
              { name: 'Home', path: '/' },
              { name: 'Projects', path: '/projects' },
              { name: project.name, path: `/projects/${project.id}` },
            ]),
          ]}
        />
      )}
      <ProjectDetailsClient id={id} initialProject={project} />
    </>
  );
}
