'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders `children` only once the wrapper scrolls near the viewport, keeping
 * heavy mounts (e.g. the Google Maps SDK) out of the initial load. The wrapper
 * fills its parent, so give the PARENT a fixed height to avoid any layout shift
 * when children mount. `placeholder` is shown until then.
 *
 * Falls back to rendering immediately where IntersectionObserver is unavailable
 * (very old browsers / SSR safety).
 */
export function LazyVisible({
  children,
  placeholder,
  rootMargin = '300px',
}: {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className="h-full w-full">
      {visible ? children : placeholder ?? null}
    </div>
  );
}
