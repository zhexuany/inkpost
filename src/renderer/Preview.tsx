import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { buildScrollMap } from './scroll-sync/buildScrollMap';
import { rafThrottle } from './scroll-sync/rafThrottle';
import type { ScrollMap } from './scroll-sync/types';

export interface PreviewHandle {
  getScrollElement(): HTMLElement | null;
  getScrollMap(): ScrollMap;
  refreshScrollMap(): void;
}

interface PreviewProps {
  html: string;
  scrollToOffset?: number;
  onScroll?: (offset: number) => void;
  onScrollMapReady?: (map: ScrollMap) => void;
  onJumpToLine?: (lineIndex: number) => void;
}

const Preview = forwardRef<PreviewHandle, PreviewProps>(
  ({ html, scrollToOffset, onScroll, onScrollMapReady, onJumpToLine }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const isSyncingScroll = useRef(false);
    const scrollMapRef = useRef<ScrollMap>([]);
    const onScrollMapReadyRef = useRef(onScrollMapReady);
    onScrollMapReadyRef.current = onScrollMapReady;

    const getScrollElement = useCallback((): HTMLElement | null => {
      return iframeRef.current?.contentDocument?.documentElement ?? null;
    }, []);

    const getScrollMap = useCallback((): ScrollMap => {
      return scrollMapRef.current;
    }, []);

    const refreshScrollMap = useCallback(() => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const container = doc.documentElement;
      scrollMapRef.current = buildScrollMap(container);
      onScrollMapReadyRef.current?.(scrollMapRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      getScrollElement,
      getScrollMap,
      refreshScrollMap,
    }));

    // Write HTML into iframe + build scroll map + attach listeners
    useEffect(() => {
      if (!iframeRef.current) return;
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<style>
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
}
</style>
</head>
<body>${html}</body>
</html>`);
      doc.close();

      // Build scroll map after DOM is ready
      const container = doc.documentElement;
      scrollMapRef.current = buildScrollMap(container);
      onScrollMapReadyRef.current?.(scrollMapRef.current);

      // Click handler: jump to corresponding source line via data-source-start
      const handleClick = (e: MouseEvent) => {
        if (!onJumpToLine) return;
        const el = (e.target as Element)?.closest?.('[data-source-start]');
        if (!el) return;
        const lineAttr = el.getAttribute('data-source-start');
        if (!lineAttr) return;
        const line = parseInt(lineAttr, 10);
        if (!isNaN(line)) {
          onJumpToLine(line - 1); // 1-based → 0-based
        }
      };

      // Scroll handler
      const handleIframeScroll = rafThrottle(() => {
        if (isSyncingScroll.current || !onScroll) return;
        onScroll(doc.documentElement.scrollTop);
      });

      doc.addEventListener('click', handleClick);
      doc.addEventListener('scroll', handleIframeScroll, { passive: true });

      return () => {
        doc.removeEventListener('click', handleClick);
        doc.removeEventListener('scroll', handleIframeScroll);
      };
    }, [html, onScroll, onJumpToLine]);

    // Sync from external scroll offset (editor → preview)
    useEffect(() => {
      if (scrollToOffset === undefined) return;
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      isSyncingScroll.current = true;
      doc.documentElement.scrollTop = Math.max(0, scrollToOffset);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }, [scrollToOffset]);

    return (
      <iframe
        ref={iframeRef}
        className="preview-iframe"
        sandbox="allow-same-origin allow-scripts"
        title="Preview"
      />
    );
  },
);

Preview.displayName = 'Preview';
export default Preview;
