import type { Metadata } from 'next';
import CollectionsListClient from './CollectionsListClient';

export const metadata: Metadata = {
  title: 'Curated Property Collections',
  description:
    'Browse curated collections of verified listings on BayBayt — zero-brokerage owner homes, RERA-approved projects, ready-to-move properties, and more.',
  alternates: { canonical: '/collections' },
};

export default function Page() {
  return <CollectionsListClient />;
}
