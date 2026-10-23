import type { Metadata } from 'next';
import PropertiesListClient from './PropertiesListClient';

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent',
  description:
    'Browse verified, owner-direct homes, commercial spaces, and land for sale and rent across India on BayBayt. Filter by city, budget, BHK, and more.',
  alternates: { canonical: '/properties' },
};

export default function Page() {
  return <PropertiesListClient />;
}
