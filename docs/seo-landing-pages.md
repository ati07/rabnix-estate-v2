# SEO Landing Pages — Locality & Property-Type

Programmatic long-tail landing pages for BayBayt, layered **on top of** the
existing city landing page (`/properties/in/[city]`). This is the highest-ROI
SEO lever for a property portal: real-estate search is long-tail
("2 BHK flats in Wakad", "shops for rent in Lucknow", "plots in Gurgaon"), and
each of those queries deserves its own indexable, server-rendered page.

> **Design constraint for this change: purely additive.** No existing page,
> loader, API, or behavior is modified in a way that changes current
> functionality. New route files + a new helper module + additive sitemap
> entries + a new (non-breaking) JSON-LD export. The only touch to an existing
> page is repointing the city page's "Popular localities" chips at the new,
> richer locality pages (a safe href swap, same destination inventory).

## URL scheme

A single catch-all route sits **below** the existing city page, so the two
never collide (`[city]/page.tsx` handles exactly one segment; the catch-all
handles two or more):

```
src/app/properties/in/[city]/page.tsx          ← existing, untouched
src/app/properties/in/[city]/[...filters]/page.tsx   ← NEW
```

Supported shapes:

| URL | Meaning |
|---|---|
| `/properties/in/pune/wakad` | locality page |
| `/properties/in/pune/2-bhk-flats` | property-type page |
| `/properties/in/pune/wakad/2-bhk-flats` | locality + type page |

Segment resolution (in `src/lib/seoLandings.ts`):

- **1 segment** → first try the controlled property-type vocabulary; if it is
  not a known type token, treat it as a **locality** slug and resolve against
  the city's actual inventory.
- **2 segments** → `[locality, type]`. First must resolve to a locality with
  inventory, second must be a known type token.
- Anything that resolves to **zero** real listings → `notFound()` (404), so we
  never publish thin/empty pages.

## Property-type vocabulary (controlled)

Canonical slug → filter predicate over the real listing set. One canonical slug
per concept (no `flats`+`apartments` duplicates) to avoid duplicate content.

| Slug | Label (H1/title) | Matches |
|---|---|---|
| `for-sale` | Property for Sale | `dealPhrase === 'for Sale'` |
| `for-rent` | Property for Rent | `dealPhrase === 'for Rent'` |
| `pg` | PG & Co-Living | `listingType === 'pg'` |
| `flats` | Flats & Apartments | `category === 'Apartment'` |
| `villas` | Villas | `category === 'Villa'` |
| `builder-floors` | Builder Floors | `category === 'Builder Floor'` |
| `studio-apartments` | Studio Apartments | `category === 'Studio'` |
| `penthouses` | Penthouses | `category === 'Penthouse'` |
| `plots` | Plots & Land | `listingType === 'plot'` or category `Residential Plot` / `Commercial Land` |
| `commercial` | Commercial Property | `listingType === 'commercial'` |
| `office-space` | Office Spaces | `category === 'Commercial Office'` |
| `shops` | Shops & Retail | `category === 'Retail Shop'` |
| `warehouses` | Warehouses | `category === 'Warehouse'` |
| `{n}-bhk` (1–5) | {n} BHK Homes | `bhk === n` |
| `{n}-bhk-flats` (1–5) | {n} BHK Flats | `bhk === n && category === 'Apartment'` |

BHK slugs are generated programmatically.

## Data flow (reuses tested code)

1. `resolveCitySlug(slug)` → canonical city name (from `cityLoader.ts`). 404 if none.
2. `getCityProperties(city)` → all approved listings for the city, phone
   withheld (from `cityLoader.ts`). **No new DB query logic** — we filter this
   in memory, exactly as the city page already derives localities/categories.
3. `seoLandings.ts` applies the locality and/or type predicate.
4. Render with the same header/footer/card markup as the city page.

## Rendering & SEO

Each page emits:
- Server-rendered `<h1>`, intro copy, verified-count chips, listing grid (same
  card as city page, keyword-rich alt text via `propertyImageAlt`).
- **Cross-links** to sibling pages (other localities, other types within the
  city, and the parent city page) — the internal-linking mesh that gets these
  pages crawled.
- **JSON-LD**: `BreadcrumbList`, a `CollectionPage` + `ItemList` of the matching
  listings (new additive `landingCollectionJsonLd` export), and a contextual
  `FAQPage`.
- `generateMetadata`: title `{typeLabel} in {locality, }{city}`, matching
  description, self-canonical.

## Static generation & discovery

- `generateStaticParams`: per city, pre-render the **single-segment** pages
  (localities + type tokens) that have ≥1 listing. Two-segment combos render
  on-demand via ISR (`dynamicParams` default true) and are reached via internal
  links.
- `revalidate = 3600` (matches the city page) so new inventory surfaces hourly.
- `sitemap.ts` (additive): add every single-segment locality and type landing
  page that has inventory, per city.

## Files

| File | Change |
|---|---|
| `docs/seo-landing-pages.md` | this doc (new) |
| `src/lib/seoLandings.ts` | new — type vocabulary, resolvers, filters, path enumeration |
| `src/app/properties/in/[city]/[...filters]/page.tsx` | new — the landing page |
| `src/components/seo/JsonLd.tsx` | **additive** — new `landingCollectionJsonLd` export |
| `src/app/sitemap.ts` | **additive** — enumerate landing paths per city |
| `src/app/properties/in/[city]/page.tsx` | locality chips repointed to new pages (safe href swap) |

## Safety / no-regression notes

- Existing `[city]` route, all loaders, APIs, and the filter search
  (`/properties?...`) are unchanged in behavior.
- New catch-all cannot shadow the existing single-segment city route.
- Empty/thin pages 404 rather than publish, protecting crawl budget.
- All new DB reads reuse `getCityProperties` (already battle-tested, phone
  withheld). No anti-scraping regression: same serialization path.
