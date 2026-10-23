import type { Metadata } from 'next';
import PropertiesMapClient from './PropertiesMapClient';

export const metadata: Metadata = {
  title: 'Property Map Search',
  description:
    'Search verified properties on an interactive map across India on BayBayt. Draw a radius, explore localities, and see nearby listings.',
  alternates: { canonical: '/properties/map' },
};

export default function Page() {
  return <PropertiesMapClient />;
}
