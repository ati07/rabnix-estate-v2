import type { Metadata } from 'next';
import BuildersListClient from './BuildersListClient';

export const metadata: Metadata = {
  title: 'Builders & Developers',
  description:
    'Discover leading real estate builders and developers across India on BayBayt — their projects, track record, RERA registrations, and cities of operation.',
  alternates: { canonical: '/builders' },
};

export default function Page() {
  return <BuildersListClient />;
}
