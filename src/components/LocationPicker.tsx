'use client';

/**
 * LocationPicker — SSR-safe wrapper around the Google Maps location picker. The
 * map needs the browser SDK, so it is loaded client-side only via next/dynamic.
 * Import THIS component anywhere; never import LocationPickerMap directly.
 */

import dynamic from 'next/dynamic';
import type { LocationPickerProps } from './LocationPickerMap';

export type { LatLng, LocationValue, LocationPickerProps } from './LocationPickerMap';

const Map = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="h-11 w-full rounded-xl bg-[#F1F5F9] animate-pulse" />
      <div className="h-64 w-full rounded-xl bg-[#F1F5F9] animate-pulse" />
    </div>
  ),
});

export default function LocationPicker(props: LocationPickerProps) {
  return <Map {...props} />;
}
