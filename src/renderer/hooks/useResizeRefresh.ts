import { useEffect, useRef } from 'react';
import type { PreviewHandle } from '../Preview';

/**
 * Uses ResizeObserver on the preview's scroll element to trigger
 * ScrollMap refresh when content size changes (images load, etc.).
 */
export function useResizeRefresh(
  previewRef: React.RefObject<PreviewHandle | null>,
  onRefresh: () => void,
  enabled: boolean,
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const preview = previewRef.current;
    if (!preview) return;

    const el = preview.getScrollElement();
    if (!el) return;

    const scheduleRefresh = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        onRefresh();
      });
    };

    observerRef.current = new ResizeObserver(() => {
      scheduleRefresh();
    });

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [previewRef, onRefresh, enabled]);
}
