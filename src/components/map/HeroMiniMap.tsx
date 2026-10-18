'use client';

/**
 * HeroMiniMap — the compact live map embedded in the home hero.
 *
 * It reuses the SAME data source (useProperties) and the SAME map component
 * (PropertyDiscoveryMap) as the full /properties/map discovery view, so there is
 * no second map implementation to keep in sync. It shows price-pill pins for the
 * selected city's listings that have real coordinates; when the user picks a
 * locality/area with coordinates in the search bar, `focus` recenters the map
 * there and draws the same radius circle the full map uses — a visual preview of
 * the "search near here" the "Open full map" button will open.
 *
 * Gesture handling is cooperative so scrolling the landing page doesn't get
 * trapped by the map. Rendering is gated on a configured key by the child.
 */

import { useEffect, useMemo, useState } from 'react';
import { useProperties } from '@/lib/propertyContext';
import { normalizeCoordinates, type LatLngLiteral } from '@/lib/maps/config';
import PropertyDiscoveryMap, { type PropertyMarker } from './PropertyDiscoveryMap';

const PREVIEW_RADIUS_M = 3000;

export function HeroMiniMap({
  city,
  focus,
}: {
  city: string;
  /** Coordinates of a locality/area the user picked; centers + circles the map. */
  focus?: LatLngLiteral | null;
}) {
  const { properties } = useProperties();

  const markers = useMemo<PropertyMarker[]>(() => {
    const inCity = !!city && city !== 'All Cities';
    const out: PropertyMarker[] = [];
    for (const p of properties) {
      if (inCity && p.city?.toLowerCase() !== city.toLowerCase()) continue;
      const loc = normalizeCoordinates(p.coordinates);
      if (!loc) continue;
      out.push({
        id: p.id,
        title: p.title,
        priceFormatted: p.priceFormatted,
        locality: p.locality,
        city: p.city,
        image: p.images?.[0],
        location: loc,
      });
    }
    return out;
  }, [properties, city]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Local center so dragging the focus pin feels alive; reseeded from `focus`.
  const [center, setCenter] = useState<LatLngLiteral | null>(focus ?? null);
  useEffect(() => {
    setCenter(focus ?? null);
  }, [focus?.lat, focus?.lng]);

  return (
    <PropertyDiscoveryMap
      markers={markers}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onBoundsChange={() => {}}
      fallbackCity={city && city !== 'All Cities' ? city : undefined}
      radiusCenter={center}
      radiusMeters={PREVIEW_RADIUS_M}
      onCenterChange={setCenter}
      gestureHandling="cooperative"
    />
  );
}

export default HeroMiniMap;
