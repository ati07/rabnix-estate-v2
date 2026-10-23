# BayBayt SEO + AEO Plan

_Last updated: 2026-10-24 · Canonical domain: https://www.baybayt.com_

Living version (with the architecture diagram): https://claude.ai/artifact/GjLjA8HY4yaprPq34eBHWF

This plan covers both **SEO** (ranking in Google/Bing search results) and **AEO**
(Answer Engine Optimization — being cited by AI answer engines like ChatGPT,
Perplexity, Google AI Overviews, and Gemini). The two share a foundation:
server-rendered HTML, clean metadata, and structured data. AEO adds an emphasis
on machine-readable facts, explicit Q&A, entity schema, and an `llms.txt`.

## Current State & Gaps

BayBayt ships one root `metadata` block in `src/app/layout.tsx` and nothing else,
so every route inherits the same generic title and description. Two root causes
make this worse than it looks: the money pages are all client components (they
cannot export page metadata), and their data loads in the browser (so the
server-rendered HTML a crawler — or an AI engine — receives is an empty shell).

| Area | Today | Impact |
| --- | --- | --- |
| Per-page titles | All pages inherit the root title | Google shows "BayBayt - Buy, Rent, PG…" on every property and listing |
| Page type | `/`, `/properties`, `/properties/[id]`, `/projects`, `/projects/[id]` are `'use client'` | Client components cannot export `metadata`/`generateMetadata` |
| Listing content | Fetched client-side via `useProperties()` context | SSR HTML has no listing title, price, or description for crawlers / AI engines |
| Sitemap | None | Search engines have no map of indexable URLs |
| robots.txt | None | No crawl directives; private routes (`/dashboard`, `/admin`) not disallowed |
| Structured data | None | No rich results or machine-readable facts for listings (price, address, rooms) |
| Canonical URLs | None | Duplicate/param URLs compete for ranking |
| AEO surfaces | None | No `llms.txt`, no FAQ schema, no entity (`Organization`) graph for AI engines |
| `siteUrl` resolver | Broken in `layout.tsx` (dead `https://` branch) | OG/Twitter image URLs can resolve wrong in production |

## Core Architecture Decision — Server-Wrapper Pattern

Every money page is a client component, so it cannot export metadata and its data
arrives in the browser — crawlers and AI engines get an empty shell. The fix: wrap
each dynamic route in a thin **server component** that exports `generateMetadata()`,
loads the record server-side, renders JSON-LD, and passes the record to the existing
client component as a prop. One loader becomes the single source of truth for
metadata, server HTML, and the sitemap.

```
Request (crawler / AI engine / browser)
        │
        ▼
Server Component — page.tsx  (App Router, runs on the server)
        ├──────────────► generateMetadata()   → title · canonical · OG image
        └──────────────► Page body (JSX)       → JsonLd + client child
                                   │
                                   ▼
                         propertyLoader.ts  (Prisma · server-only)
                                   │
                                   ▼
                         serializeProperty(p, false)   (phone stripped)
                                   │
                                   ▼
                         Full SSR HTML   (title + content + JSON-LD)
                                   │
                                   ▼
                         Client hydration   (360°/video · OTP reveal · shortlist)
```

The client child still owns all interactivity; it just receives its first record
as a prop instead of fetching it.

## Phase A — Foundations ✅ (done & verified)

Low-risk, additive work that gives search engines and AI crawlers a baseline.

- **Step 1 — Site-URL resolver + env** (`src/lib/siteUrl.ts`, `src/app/layout.tsx`):
  `getSiteUrl()` resolves `SITE_URL` → `https://${VERCEL_URL}` → `http://localhost:3000`.
  Resolved **server-side only**, so it uses a plain `SITE_URL` (not `NEXT_PUBLIC_*`,
  which trips up the Vercel build). Root metadata gained a title template
  (`%s | BayBayt`), `alternates.canonical`, `robots` (index/follow + googleBot
  `max-image-preview:large`), and `openGraph` `siteName`/`url`/`locale: en_IN`.
- **Step 4 — Sitemap** (`src/app/sitemap.ts`): static routes + every approved
  property, project, builder, collection, and preferred agent. `revalidate = 3600`.
  Served at `/sitemap.xml`.
- **Step 5 — Robots** (`src/app/robots.ts`): allow `/`, disallow `/dashboard`,
  `/admin`, `/api/`, `/auth`, `/post-*`; points at the sitemap. Served at `/robots.txt`.

Verified: `tsc` clean; `/robots.txt` and `/sitemap.xml` return 200 locally (61 URLs).

## Phase B — Structured Data, Loader & AEO

- **Step 2 — Shared server loader** (`src/lib/propertyLoader.ts`, server-only):
  `getPropertyForPage(id)` → `prisma.property.findUnique` + `serializeProperty(p, false)`
  (phone withheld — anti-scraping). `getVerifiedProperties()` feeds the sitemap and
  `generateStaticParams`. Keeps Prisma out of client bundles.
- **Step 6 — JSON-LD** (`src/components/seo/JsonLd.tsx`): a tiny server component
  rendering `<script type="application/ld+json">`, with typed builders:
  - Sitewide (in `layout.tsx`): `Organization` (logo, name, URL, social `sameAs`) +
    `WebSite` with `potentialAction: SearchAction` (Google sitelinks search box).
  - Property detail: `Product`/`RealEstateListing` — name, images, `offers`
    (price + INR + availability), `PostalAddress`, `numberOfRooms` (BHK),
    `floorSize` (carpet area) — plus a `BreadcrumbList`.
  - **No phone number in any JSON-LD** (anti-scraping).
- **AEO additions:**
  - `llms.txt` at the site root — a concise, machine-readable summary of what
    BayBayt is, its key sections, and canonical URLs, for AI answer engines.
  - `FAQPage` JSON-LD on pages that carry genuine Q&A (collections already store
    `faqs`; surface them as structured data).
  - Entity clarity: a single consistent `Organization` graph so AI engines resolve
    "BayBayt" as one entity across pages.

Verification: Google Rich Results Test (no errors, no contact phone); confirm
`/llms.txt` renders.

## Phase C — Detail Refactor & Polish ✅ (done & verified)

Medium risk — touched the large, interactive `[id]` pages; delivers per-listing
titles and real server-rendered content.

- **Step 3 — Server-wrappers** (done): each money page is split into a
  `<Type>DetailsClient.tsx` (still `'use client'`, seeded from the server) fronted
  by a thin server `page.tsx` that exports `generateMetadata` and renders the
  type's JSON-LD. Covers `/properties/[id]` (RealEstateListing + Breadcrumb),
  `/projects/[id]` (ApartmentComplex), `/builders/[id]` (Organization),
  `/agents/[id]` (RealEstateAgent), `/collections/[id]` (CollectionPage + **FAQPage**).
  Server loaders live in `src/lib/propertyLoader.ts` + `src/lib/seoLoaders.ts`
  (phone always withheld; approved/public records only). Non-approved listings get
  `robots:noindex`.
- **Step 7 — List & static polish** (done): static `metadata` (title/description/
  canonical) on `/properties`, `/projects`, `/agents`, `/builders`, `/collections`,
  `/properties/map`, each via a server `page.tsx` + `<Name>ListClient.tsx`.

Verified: `tsc` clean; every route returns 200 with its own `<title>`, correct
JSON-LD types, real seeded content in the SSR HTML, and no phone in the markup.

- **Polish (done):** `src/lib/seoText.ts` produces keyword-rich, per-photo
  `<Image alt>` ("3 BHK Apartment for Sale in <locality>, <city> — photo N")
  across the indexable property surfaces (detail main/thumbnails/similar,
  PropertyCard, quick-view modal, properties list, home Fresh/Owner rails);
  project detail alts carry name/builder/locality. A branded 1200×630
  `src/app/opengraph-image.tsx` is auto-applied as the default
  og:image/twitter:image (detail pages still override with the real listing photo).

**Remaining polish (optional):** `generateStaticParams` + ISR on detail routes;
city landing pages (`/properties/pune`).

## Phasing, Risks & Open Questions

| Phase | Steps | Risk | Payoff | Status |
| --- | --- | --- | --- | --- |
| A — Foundations | 1, 4, 5 | Low (additive) | Crawlability + indexing baseline | Done |
| B — Structured data + AEO | 2, 6, AEO | Low | Rich results, sitewide schema, AI citeability | Done |
| C — Detail refactor | 3, 7 | Medium | Per-listing titles + real SSR content | Done |

**Open questions**

1. ~~Canonical domain~~ — resolved: **https://www.baybayt.com**.
2. ~~`generateStaticParams` + ISR vs pure dynamic SSR?~~ — shipped as dynamic SSR with `revalidate` (ISR at the route level); per-param static generation left as optional polish.
3. City landing pages (e.g. `/properties/pune`) — strong organic lever, separate feature. Now or later?

**Env note:** set `SITE_URL=https://www.baybayt.com` in Vercel (not `NEXT_PUBLIC_*`).
