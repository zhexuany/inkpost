import type { ScrollMap, ScrollMapItem } from './types';

/**
 * Build a ScrollMap from a preview container's DOM.
 * Queries all elements with [data-source-start] and computes their
 * positions relative to the container.
 */
export function buildScrollMap(container: HTMLElement): ScrollMap {
  const items: ScrollMapItem[] = [];
  const elements = container.querySelectorAll<HTMLElement>('[data-source-start]');

  for (const el of elements) {
    const startAttr = el.getAttribute('data-source-start');
    const endAttr = el.getAttribute('data-source-end');
    if (!startAttr || !endAttr) continue;

    const sourceStartLine = parseInt(startAttr, 10);
    const sourceEndLine = parseInt(endAttr, 10);
    if (isNaN(sourceStartLine) || isNaN(sourceEndLine)) continue;

    // Compute position relative to the scroll container
    let top = 0;
    let current: HTMLElement | null = el;
    while (current && current !== container) {
      top += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }

    const height = el.offsetHeight;

    items.push({
      sourceStartLine,
      sourceEndLine,
      sourceStartOffset: attrToOptionalInt(el.getAttribute('data-source-start-offset')),
      sourceEndOffset: attrToOptionalInt(el.getAttribute('data-source-end-offset')),
      previewTop: top,
      previewBottom: top + height,
      previewHeight: height,
      element: el,
    });
  }

  // Sort by sourceStartLine
  items.sort((a, b) => a.sourceStartLine - b.sourceStartLine);

  return items;
}

function attrToOptionalInt(val: string | null): number | undefined {
  if (val === null) return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) ? undefined : n;
}
