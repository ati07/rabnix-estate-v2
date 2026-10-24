'use client';

import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

// Map ANY uploaded image onto the full 360°×180° sphere, whatever its aspect
// ratio. Without this, Photo Sphere Viewer treats a non-2:1 image as a cropped
// panorama and leaves black bands (which looks broken). By declaring the image
// to BE the whole sphere, every upload fills the view and stays fully
// navigable — no 2:1 requirement is imposed on the user.
const fillSphere = (image: HTMLImageElement) => ({
  fullWidth: image.width,
  fullHeight: image.height,
  croppedWidth: image.width,
  croppedHeight: image.height,
  croppedX: 0,
  croppedY: 0,
});

// WebGL 360° panorama viewer. Import this ONLY via next/dynamic with
// { ssr: false } — Photo Sphere Viewer touches `window`/WebGL and must not run
// on the server.
export default function PanoramaViewer({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Create the viewer AFTER preloading the first image. React 18 Strict Mode
  // mounts effects twice in dev (mount → unmount → mount); if we let the viewer
  // kick off its own fetch, the unmount's destroy() aborts that in-flight
  // request — which shows up as a 0 B "canceled" load in the Network tab and
  // can leave a blank viewer, especially for large files. Preloading first means
  // the viewer builds its texture from the browser cache instantly, so nothing
  // is left mid-flight to cancel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length === 0) return;

    let disposed = false;
    setStatus('loading');

    const img = new Image();
    img.decoding = 'async';
    img.src = images[0];

    img.onerror = () => {
      if (!disposed) setStatus('error');
    };
    img.onload = () => {
      if (disposed || !containerRef.current) return;
      try {
        const viewer = new Viewer({
          container: containerRef.current,
          panorama: images[0],
          panoData: fillSphere,
          navbar: ['zoom', 'move', 'fullscreen'],
          // Open at a normal zoom, not fully zoomed out. At zoom 0 the whole
          // sphere is squeezed into the viewport and — because PSV textures use
          // a non-mipmapped linear filter — heavy minification looks blurry.
          defaultZoomLvl: 50,
          loadingTxt: 'Loading 360° view…',
        });
        viewerRef.current = viewer;
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    };

    return () => {
      disposed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [images]);

  // Swap panoramas when the active thumbnail changes (viewer already created).
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !images[active]) return;
    setStatus('loading');
    viewer
      .setPanorama(images[active], { panoData: fillSphere })
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, [active, images]);

  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-2xl overflow-hidden bg-black aspect-2/1"
          style={{ minHeight: 320 }}
        />
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/80 p-6 text-center">
            <p className="text-sm font-semibold text-white/90">
              Couldn’t load this 360° image. Please try re-uploading it.
            </p>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                active === idx
                  ? 'border-[#18A67D] ring-2 ring-[#18A67D]/40'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`360° view ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold bg-[#0F2A43]/80 text-white px-1 rounded">360°</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
