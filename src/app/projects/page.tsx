import type { Metadata } from 'next';
import ProjectsListClient from './ProjectsListClient';

export const metadata: Metadata = {
  title: 'New Projects & Developments',
  description:
    'Explore new residential and commercial projects by leading builders across India on BayBayt — with prices, floor plans, amenities, and RERA details.',
  alternates: { canonical: '/projects' },
};

export default function Page() {
  return <ProjectsListClient />;
}
