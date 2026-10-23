'use client';

import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

// WebGL 360° panorama viewer. Import this ONLY via next/dynamic with
// { ssr: false } — Photo Sphere Viewer touches `window`/WebGL and must not run
// on the server.
export default function PanoramaViewer({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [active, setActive] = useState(0);

  // Create the viewer once; swap panoramas via setPanorama on `active` change.
  useEffect(() => {
    if (!containerRef.current || images.length === 0) return;
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: images[0],
      navbar: ['zoom', 'move', 'fullscreen'],
      defaultZoomLvl: 0,
      loadingTxt: 'Loading 360° view…',
    });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && images[active]) {
      viewer.setPanorama(images[active]).catch(() => {});
    }
  }, [active, images]);

  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden bg-black aspect-2/1"
        style={{ minHeight: 320 }}
      />
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
