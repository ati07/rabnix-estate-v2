import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getIndexableCities } from '@/lib/cityLoader';

/**
 * Server-rendered "Browse property by city" internal-links block.
 *
 * This is the internal-linking bridge that lets crawl equity flow from indexed,
 * high-authority pages (the homepage, /properties) down to the SEO city landing
 * pages (/properties/in/[city]) — which otherwise sit orphaned, reachable only
 * via the sitemap and therefore stuck at "Discovered – currently not indexed".
 *
 * It lists only cities that actually have approved inventory (getIndexableCities),
 * so every link resolves to a real page — no soft-404s. Being an async Server
 * Component, the links render into the raw SSR HTML (not behind a client Suspense
 * boundary), so Googlebot sees real crawlable <a> tags without executing JS.
 */
export async function BrowseByCitySection({ className = '' }: { className?: string }) {
  const cities = await getIndexableCities();
  if (cities.length === 0) return null;

  return (
    <section
      className={`bg-white border-t border-[#E2E8F0] ${className}`}
      aria-labelledby="browse-by-city-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 id="browse-by-city-heading" className="text-lg font-bold text-[#0F2A43] mb-1">
          Browse property by city
        </h2>
        <p className="text-sm text-[#64748B] mb-5">
          Explore verified, owner-direct properties for sale and rent across India — zero brokerage.
        </p>
        <ul className="flex flex-wrap gap-2.5">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/properties/in/${c.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#334155] hover:border-[#18A67D] hover:text-[#148a67] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                Property in {c.name}
                <span className="text-[#94A3B8]">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
