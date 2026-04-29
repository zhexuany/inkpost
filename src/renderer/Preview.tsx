import React, { useRef, useEffect } from 'react';

interface PreviewProps {
  html: string;
  markdown?: string;
  onScroll?: (ratio: number) => void;
  externalScrollRatio?: number;
  onJumpToLine?: (lineIndex: number) => void;
}

// Find the closest ancestor with meaningful text content
function getClickTargetText(el: Element | null): { text: string; tag: string } | null {
  while (el && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
    const tag = el.tagName.toLowerCase();
    // Only match block-level content elements
    if (['h1','h2','h3','h4','h5','h6','p','li','blockquote','td','th','pre'].includes(tag)) {
      const text = el.textContent?.trim() ?? '';
      if (text.length > 0) {
        return { text: text.substring(0, 80), tag };
      }
    }
    el = el.parentElement;
  }
  return null;
}

// Search for the best matching line in markdown source
function findMatchingLineIndex(markdown: string, searchText: string, tag: string): number {
  const lines = markdown.split('\n');

  // 1. Exact heading match: "# text" or "## text"
  if (tag.startsWith('h')) {
    const level = parseInt(tag[1]);
    const prefix = '#'.repeat(level);
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(prefix + ' ') && trimmed.includes(searchText)) {
        return i;
      }
    }
  }

  // 2. List item match: "- text" or "1. text"
  if (tag === 'li') {
    const plainText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        if (trimmed.includes(searchText) || trimmed.includes(searchText.replace(/\s+/g, ' '))) {
          return i;
        }
      }
    }
  }

  // 3. Fuzzy text search across all lines
  const searchWords = searchText.split(/\s+/).filter(w => w.length > 2);
  if (searchWords.length > 0) {
    let bestLine = 0;
    let bestScore = 0;
    for (let i = 0; i < lines.length; i++) {
      let score = 0;
      for (const word of searchWords) {
        if (lines[i].includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = i;
      }
    }
    if (bestScore > 0) return bestLine;
  }

  // 4. Fallback: first line
  return 0;
}

export default function Preview({ html, markdown, onScroll, externalScrollRatio, onJumpToLine }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isSyncingScroll = useRef(false);

  // Write HTML into iframe + attach listeners
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
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

    // Click handler: jump to corresponding markdown line
    const handleClick = (e: MouseEvent) => {
      if (!onJumpToLine) return;
      const target = getClickTargetText(e.target as Element);
      if (!target || !markdown) return;
      const lineIndex = findMatchingLineIndex(markdown, target.text, target.tag);
      onJumpToLine(lineIndex);
    };

    // Scroll handler: sync to editor
    const handleIframeScroll = () => {
      if (isSyncingScroll.current || !onScroll) return;
      const el = doc.documentElement;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      onScroll(el.scrollTop / maxScroll);
    };

    doc.addEventListener('click', handleClick);
    doc.addEventListener('scroll', handleIframeScroll);
    return () => {
      doc.removeEventListener('click', handleClick);
      doc.removeEventListener('scroll', handleIframeScroll);
    };
  }, [html, markdown, onScroll, onJumpToLine]);

  // Sync from external scroll ratio (editor → preview)
  useEffect(() => {
    if (externalScrollRatio === undefined) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    isSyncingScroll.current = true;
    const el = doc.documentElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = externalScrollRatio * maxScroll;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, [externalScrollRatio]);

  return (
    <iframe
      ref={iframeRef}
      className="preview-iframe"
      sandbox="allow-same-origin allow-scripts"
      title="Preview"
    />
  );
}
