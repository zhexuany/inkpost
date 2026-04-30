import type { ScrollMap, ScrollMapItem } from './types';

/**
 * Find the ScrollMapItem whose source line range contains the given line.
 * Returns null if no item contains the line.
 */
export function findItemBySourceLine(map: ScrollMap, line: number): ScrollMapItem | null {
  for (const item of map) {
    if (line >= item.sourceStartLine && line <= item.sourceEndLine) {
      return item;
    }
  }
  return null;
}

/**
 * Find the nearest ScrollMapItem for a given source line.
 * Prefers the item whose range contains the line, then the item
 * whose sourceStartLine is nearest (before or after).
 */
export function findNearestItemBySourceLine(map: ScrollMap, line: number): ScrollMapItem | null {
  if (map.length === 0) return null;

  // Find item that contains this line, or the last item before this line
  let bestItem = map[0];
  for (const item of map) {
    if (line >= item.sourceStartLine && line <= item.sourceEndLine) {
      return item;
    }
    if (item.sourceStartLine <= line) {
      bestItem = item;
    } else {
      break; // sorted by sourceStartLine, no more candidates
    }
  }
  return bestItem;
}

/**
 * Find the ScrollMapItem whose previewTop range contains the given scroll offset.
 */
export function findItemByPreviewTop(map: ScrollMap, top: number): ScrollMapItem | null {
  for (const item of map) {
    if (top >= item.previewTop && top < item.previewBottom) {
      return item;
    }
  }
  return null;
}

/**
 * Find the nearest ScrollMapItem for a given preview scroll offset.
 */
export function findNearestItemByPreviewTop(map: ScrollMap, top: number): ScrollMapItem | null {
  if (map.length === 0) return null;

  let bestItem = map[0];
  for (const item of map) {
    if (top >= item.previewTop && top < item.previewBottom) {
      return item;
    }
    if (item.previewTop <= top) {
      bestItem = item;
    } else {
      break;
    }
  }
  return bestItem;
}
