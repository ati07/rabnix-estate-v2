# Claude Code Task: Integrate Interactive Maps into the Existing BayBayt Real Estate Platform

You are working on my existing, nearly completed real estate platform, **BayBayt**. Your task is to integrate interactive mapping and location-based property discovery into the existing application without rebuilding the platform or breaking any current functionality.

## 1. First, inspect the existing project

Before making changes:

- Inspect the frontend, backend, database schema, property listing model, property creation/edit forms, property detail pages, search filters, authentication, and API routes.
- Identify the existing framework, ORM, database, component library, styling conventions, and data-fetching patterns.
- Determine how property addresses, cities, localities, images, prices, and other listing information are currently stored.
- Identify whether latitude and longitude fields already exist.
- Review existing validation, permissions, and API error handling.
- Create a clear list of files that need to change and why.

Do not assume a particular framework, database, file structure, or property schema. Use the actual codebase.

**Important:** Preserve the current architecture, design system, existing features, and naming conventions. Make minimal, targeted changes. Do not replace working components or introduce duplicate implementations.

## 2. Integrate Google Maps Platform

Use Google Maps Platform as the initial mapping provider.

Evaluate the currently supported Google Maps JavaScript API, Places API, Geocoding API, and any other services required for the requested features.

Choose the smallest set of APIs necessary. Check current documentation and pricing before enabling billable services.

Implement these four features.

### Feature A: Interactive property search

Create an interactive map-based property discovery experience using real property listings from the existing database.

Requirements:

- Display available properties as map markers.
- Show each marker's property price using the existing currency and formatting conventions.
- Clicking a marker opens a compact property preview with its image, title, price, locality, and link to the property detail page.
- Clicking a property card highlights its corresponding marker and centers the map on it.
- Synchronize map markers with existing search filters, including location, property type, price range, bedrooms, and other supported filters.
- Support map/list split view on desktop and a usable mobile layout.
- Fetch properties based on the visible map bounds when the user pans or zooms.
- Add marker clustering when many properties are displayed.
- Debounce map movement requests and avoid unnecessary API/database calls.
- Show loading, empty, error, and invalid-coordinate states.
- Preserve existing search behavior and URL-based filters where applicable.

Use actual published and eligible property records. Never insert demonstration properties into production data.

### Feature B: Nearby places and amenities

Allow users to discover useful facilities around a property.

Include categories such as:

- Schools and universities
- Hospitals and clinics
- Restaurants and cafes
- Shopping malls and supermarkets
- Metro stations, bus stations, and public transport
- Parks and recreational facilities

Requirements:

- Show nearby facilities on the property detail map.
- Let users enable or disable individual amenity categories.
- Display the facility name, category, distance from the property, and any supported rating or other useful information.
- Provide a link to view directions in Google Maps.
- Use the appropriate supported Places API functionality.
- Request additional place details only when needed.
- Cache eligible results according to the provider's terms and applicable retention restrictions.
- Do not repeatedly request nearby places on every component render or map movement.
- Handle unavailable categories, API errors, and empty results gracefully.

Do not invent facilities, ratings, travel times, or distances. Clearly distinguish straight-line distance from driving or walking distance.

### Feature C: Property detail map

Integrate a map into the existing property detail page without disrupting the current layout.

Requirements:

- Display the property's saved latitude and longitude.
- Show its location and address when available.
- Provide a button to open directions in Google Maps.
- Make the map responsive and accessible.
- Allow users to explore nearby facilities.
- Respect any existing location privacy settings.
- Support approximate property locations when an owner chooses not to disclose an exact address publicly.
- Never expose private owner information or internal listing data through map APIs.

If a property lacks coordinates, implement a safe fallback. Do not silently place the property at an arbitrary city center and present that location as exact.

### Feature D: Search by area or distance

Enable location-based searches using the existing property search interface.

Requirements:

- Let users search for an address, city, locality, or other supported geographic area.
- Integrate address autocomplete where appropriate.
- Support searching within a user-selected radius, such as 1 km, 5 km, 10 km, or 25 km.
- Allow users to select a location on the map where practical.
- Support searching within the visible map bounds.
- Combine geographic filters with existing property filters.
- Return only eligible listings that satisfy all active filters.
- Show the number of matching properties.
- Keep the map and property results synchronized.

Use efficient database-side geographic filtering whenever supported by the existing database.

For PostgreSQL, evaluate PostGIS or an appropriate indexed latitude/longitude strategy. For other databases, use the existing database's suitable geographic capabilities. Do not migrate databases or introduce a new database solely for this feature without demonstrating why it is necessary.

Validate coordinates, radius values, and geographic inputs on the server. Add suitable indexes if required.

## 3. Property creation and editing

Integrate location selection into the existing property create/edit workflow.

Requirements:

- Add an address autocomplete field if the existing form does not already provide one.
- Allow the owner to confirm or adjust the property marker on the map.
- Save the selected latitude and longitude with the existing property record.
- Populate coordinates from a valid selected place when possible.
- Keep existing address, city, locality, and postal-code fields compatible with the current schema.
- Ensure editing a property does not accidentally clear existing coordinates.
- Validate and normalize location data before saving.
- Follow existing authentication, authorization, and validation rules.

Avoid geocoding the same address on every page load. Resolve coordinates when a property is created or its address changes, or when performing an explicit, controlled backfill.

If existing listings lack coordinates, propose a safe backfill process with dry-run support, error reporting, and rate limiting. Do not run a bulk geocoding job automatically without my approval.

## 4. Google Maps API configuration and security

Provide clear setup instructions for Google Cloud.

Identify the required APIs and how to enable them.

Use environment variables following the conventions of the existing project.

For example, if appropriate for the existing stack:

- A browser Maps key restricted to authorized website origins and the APIs needed by the frontend.
- A separate server-side key restricted to the necessary APIs and server environment, only if server-side Google APIs are used.

Never commit real keys or expose server-side secrets to browser code.

Add appropriate configuration validation and useful setup documentation.

Configure usage controls, quotas, billing alerts, and error handling. Do not assume free-tier usage guarantees that the application will have no charges.

Review the current Google Maps Platform pricing applicable to my billing country and usage before recommending a production configuration.

## 5. Performance and scalability

The integration must be production-ready.

- Reuse the existing API and data-fetching architecture.
- Avoid fetching every property when only a geographic subset is required.
- Avoid duplicate requests and unnecessary component re-renders.
- Debounce and, where appropriate, cancel obsolete map search requests.
- Use pagination or the existing scalable search mechanism.
- Cluster markers for large result sets.
- Cache only data that may legally be cached under the applicable provider terms.
- Keep map scripts and components from unnecessarily increasing the initial page load.
- Use sensible default map bounds and zoom levels based on real search context.
- Avoid exposing the Google API key through server logs or error messages.

## 6. UI and design

Use BayBayt's existing design system, colors, typography, spacing, buttons, cards, and responsive breakpoints.

The map must look like a native part of BayBayt, not a separate demo application.

Ensure:

- Desktop split-view property search.
- Mobile-friendly map and list controls.
- Consistent property preview cards.
- Clear map markers and selected-property states.
- Accessible controls and keyboard navigation where supported.
- Proper loading skeletons, empty states, and error messages.

Do not redesign unrelated pages.

## 7. Testing and verification

After implementation:

- Test property creation and editing with location selection.
- Test property detail maps.
- Test marker-to-card and card-to-marker synchronization.
- Test every existing filter combined with location and radius filters.
- Test invalid and missing coordinates.
- Test map searches with no matching results.
- Test API failures, missing keys, and quota errors.
- Test mobile responsiveness.
- Verify that private, deleted, unpublished, or otherwise ineligible properties do not appear in public map results.
- Run the existing lint, type-check, and test commands.
- Run the production build if the environment permits.
- Fix regressions introduced by the implementation.

Do not claim tests passed unless you actually ran them.

## 8. Required implementation workflow

Work in these stages:

**Stage 1:** Inspect the existing code and report the architecture, affected files, required APIs, and potential risks.

**Stage 2:** Present a concise implementation plan, including any database changes and anticipated Google Maps costs.

**Stage 3:** Implement the integration using the smallest safe set of changes. Do not stop after producing a plan if the repository is accessible and the work can be completed.

**Stage 4:** Run tests, resolve regressions, and summarize the results.

**Stage 5:** Document the environment variables, Google Cloud setup, database migrations, deployment steps, and any manual configuration I need to complete.

If a Google API key or cloud configuration is missing, implement the code and document the missing setup. Do not invent credentials or claim the live integration is verified without testing it.

## 9. Final response

At completion, provide:

1. Features implemented.
2. Files created or modified.
3. Database changes and migration instructions.
4. Google APIs that must be enabled.
5. Required environment variables.
6. Exact setup and deployment steps.
7. Tests and build results.
8. Expected API billing considerations.
9. Any remaining work or limitations.

**Final instruction:** This is an enhancement to an existing, nearly completed production-oriented platform. Inspect first, preserve existing functionality, avoid unnecessary dependencies, and implement the requested mapping features in a maintainable and secure way.


Pricing:

https://mapsplatform.google.com/intl/en_in/pricing/
