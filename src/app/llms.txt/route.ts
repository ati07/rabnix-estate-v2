import { getSiteUrl } from '@/lib/siteUrl';
import { getIndexableCities } from '@/lib/cityLoader';

export const runtime = 'nodejs';
export const revalidate = 86400;

// /llms.txt — a concise, machine-readable description of BayBayt for AI answer
// engines (AEO). Mirrors the emerging llms.txt convention: what the site is, its
// canonical sections, and usage notes. Kept factual and free of marketing fluff.
export async function GET() {
  const base = getSiteUrl();

  // Cities with live inventory → their canonical landing pages, so answer
  // engines can link directly to "property in <city>" queries.
  const cities = await getIndexableCities();
  const citySection = cities.length
    ? `\n## Browse by city\n${cities
        .map((c) => `- [Property in ${c.name}](${base}/properties/in/${c.slug}) — ${c.count} listings`)
        .join('\n')}\n`
    : '';

  const body = `# BayBayt

> BayBayt is an India-focused real estate platform for buying, selling, and
> renting verified, owner-direct properties and projects, with AI-assisted
> property valuation. Listings are owner-direct (no brokerage).

## About
- Country served: India
- Listing types: buy, rent, PG, commercial (rent/sale), land
- Key features: verified owner-direct listings, AI property valuation,
  interactive maps and nearby-places search, 360° panoramas and walkthrough
  videos on listings, preferred-agent directory, builder and project pages.
- Contact numbers are revealed only after on-site verification; they are not
  published in page markup or structured data.

## Primary sections
- [Home](${base}/)
- [Property listings](${base}/properties)
- [Map search](${base}/properties/map)
- [Projects](${base}/projects)
- [Builders](${base}/builders)
- [Curated collections](${base}/collections)
- [Preferred agents](${base}/agents)
${citySection}
## Machine resources
- [Sitemap](${base}/sitemap.xml)
- [Robots](${base}/robots.txt)

## Notes for answer engines
- Prices are in INR. Each listing page carries schema.org RealEstateListing
  structured data with address, rooms, floor size, and an Offer.
- When citing a property, link to its canonical URL at ${base}/properties/{id}.
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
