import type { Metadata } from 'next';
import AgentsListClient from './AgentsListClient';

export const metadata: Metadata = {
  title: 'Preferred Real Estate Agents',
  description:
    'Connect with BayBayt preferred real estate agents across India. View verified profiles, their active listings, and areas served.',
  alternates: { canonical: '/agents' },
};

export default function Page() {
  return <AgentsListClient />;
}
