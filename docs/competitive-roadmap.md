# BayBayt — Competitive Roadmap vs MagicBricks / 99acres / NoBroker

_Last updated: 2026-10-26_

## TL;DR

We do **not** beat MagicBricks or 99acres on breadth — they have millions of
listings and two decades of SEO/brand. That is a two-sided liquidity moat, and
no feature closes it. We win the way **NoBroker** did: own a sharp wedge
(**owner-direct, zero brokerage**) in **2–3 cities**, build a retention loop, and
expand city by city.

The single biggest lever is **supply depth per city**, not feature count. 500
real listings in Pune beats 28 spread across 9 cities. Everything below is in
service of making a concentrated catalog feel alive and keep users coming back.

## Positioning

| | MagicBricks / 99acres | NoBroker | **BayBayt** |
|---|---|---|---|
| Core model | Broker-heavy marketplace | Owner-direct, zero brokerage | **Owner-direct, zero brokerage** |
| Moat | Inventory scale + brand | Owner supply + services | AI layer + owner-direct, early |
| Our stance | Don't fight head-on | This is our real comp | — |

Our genuine, hard-to-copy edge is the **AI layer** (Genie search, in-form
draft/price/description assist, AI valuation). Lean into it.

## What we already have (don't rebuild)

- Owner-direct listings + **anti-scraping contact gating** (OTP-gated reveal, phone withheld from payloads) — core moat, built right.
- Map discovery + radius geo-search + locality autosuggest (8126 places / 9 cities).
- AI: Genie DB-aware search, in-form assists, AI valuation.
- 360°/video/virtual tours, programmatic SEO landing pages, JSON-LD, PageSpeed work.
- City-scoped billing packs (Razorpay), preferred agents / builders / featured projects / collections.
- Per-view analytics table (`PropertyView`) already captured; `inquiriesCount` / `viewsCount` on `Property`.

## Prioritized backlog

Effort is in rough **dev-days** for one engineer, including tests + a basic UI.
`S ≤ 1d · M 2–4d · L 5–10d · XL 10d+`.

### Tier 1 — liquidity & retention (in progress)

| # | Item | Effort | Why |
|---|---|---|---|
| 1 | **Supply engine** (ops, not code): concentrate acquisition in 2–3 cities | XL (ongoing) | The whole business. Thin inventory reads as empty. |
| 2 | **Saved searches + new-listing alerts** (email) | M | #1 retention feature on every portal; makes a thin catalog feel alive. |
| 3 | **Persist the shortlist to DB** | S | `ShortlistDrawer` is client-only today; logged-in users lose it on device switch. |

Items 2–3 are what this change set delivers. Item 1 is a go-to-market effort
that the product work here supports but cannot replace.

### Tier 2 — trust & conversion

| # | Item | Effort | Why |
|---|---|---|---|
| 4 | **Owner dashboard analytics** — views / leads / contact-reveals per listing | M | We already log `PropertyView` + `contact_revealed`; surface it. Makes owners keep listing. |
| 5 | **Verified-owner / RERA trust badges** | M | Trust is the currency of owner-direct; beats broker noise. |
| 6 | **Locality insights with real depth** (rate/sq-ft trends) | L | Top-traffic, high-SEO surface. Audit whether `LocalityTrendsSection` data is real vs placeholder first. |

### Tier 3 — ancillary revenue & reach

| # | Item | Effort | Why |
|---|---|---|---|
| 7 | Rent agreements / home loans (partnership) / packers & movers / legal | L–XL each | How NoBroker monetizes beyond listings. (We removed EMI — revisit as a partner, not a calculator.) |
| 8 | Native mobile apps (iOS/Android) | XL | Portals get most traffic from apps. PWA first, native later. |
| 9 | Lead CRM for agents/builders | L | Only if we keep the agent side strategic. |

## Recommended sequence

1. **Tier 1 items 2–3** (this change set) — turn a sparse catalog into a retention loop.
2. **Tier 2 item 4** (owner analytics) — cheap, data already captured, keeps supply side happy.
3. Then trust badges + locality insights.
4. Ancillary services + mobile once liquidity is real in the beachhead cities.

Guiding rule: **don't out-feature the incumbents; out-focus them.** Win
owner-direct in a beachhead, use AI as the wedge they can't copy fast, and let
each city reach liquidity before widening.
