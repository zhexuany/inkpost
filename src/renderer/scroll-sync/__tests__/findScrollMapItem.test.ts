import { describe, it, expect } from 'vitest';
import type { ScrollMap } from '../types';
import {
  findItemBySourceLine,
  findNearestItemBySourceLine,
  findItemByPreviewTop,
  findNearestItemByPreviewTop,
} from '../findScrollMapItem';

function makeItem(
  sourceStartLine: number,
  sourceEndLine: number,
  previewTop: number,
  previewHeight: number,
) {
  return {
    sourceStartLine,
    sourceEndLine,
    previewTop,
    previewBottom: previewTop + previewHeight,
    previewHeight,
    element: null as unknown as HTMLElement,
  };
}

const sampleMap: ScrollMap = [
  makeItem(1, 1, 0, 50),    // heading, line 1
  makeItem(3, 5, 60, 80),    // paragraph, lines 3-5
  makeItem(7, 10, 150, 60),  // code block, lines 7-10
  makeItem(12, 14, 220, 40), // list, lines 12-14
];

describe('findItemBySourceLine', () => {
  it('finds exact match at start of range', () => {
    const item = findItemBySourceLine(sampleMap, 3);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
  });

  it('finds exact match inside range', () => {
    const item = findItemBySourceLine(sampleMap, 4);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
    expect(item!.sourceEndLine).toBe(5);
  });

  it('finds exact match at end of range', () => {
    const item = findItemBySourceLine(sampleMap, 5);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
  });

  it('returns null for line in gap between blocks', () => {
    const item = findItemBySourceLine(sampleMap, 6);
    expect(item).toBeNull();
  });

  it('returns null for empty map', () => {
    const item = findItemBySourceLine([], 1);
    expect(item).toBeNull();
  });
});

describe('findNearestItemBySourceLine', () => {
  it('finds exact match inside range', () => {
    const item = findNearestItemBySourceLine(sampleMap, 4);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
  });

  it('returns previous item for line in gap', () => {
    const item = findNearestItemBySourceLine(sampleMap, 6);
    expect(item).not.toBeNull();
    // line 6 is after paragraph (3-5) and before code (7-10)
    expect(item!.sourceStartLine).toBe(3); // previous item
  });

  it('returns first item for line before first', () => {
    const item = findNearestItemBySourceLine(sampleMap, 0);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(1);
  });

  it('returns last item for line after last', () => {
    const item = findNearestItemBySourceLine(sampleMap, 20);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(12);
  });

  it('returns null for empty map', () => {
    const item = findNearestItemBySourceLine([], 1);
    expect(item).toBeNull();
  });
});

describe('findItemByPreviewTop', () => {
  it('finds item by scroll offset within range', () => {
    const item = findItemByPreviewTop(sampleMap, 80);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
  });

  it('returns null for offset between items', () => {
    const item = findItemByPreviewTop(sampleMap, 145);
    expect(item).toBeNull();
  });

  it('returns null for empty map', () => {
    const item = findItemByPreviewTop([], 0);
    expect(item).toBeNull();
  });
});

describe('findNearestItemByPreviewTop', () => {
  it('finds exact match within range', () => {
    const item = findNearestItemByPreviewTop(sampleMap, 80);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3);
  });

  it('returns previous item for offset in gap', () => {
    const item = findNearestItemByPreviewTop(sampleMap, 145);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(3); // gap between paragraph end (140) and code start (150)
  });

  it('returns first item for offset before first', () => {
    const item = findNearestItemByPreviewTop(sampleMap, -10);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(1);
  });

  it('returns last item for offset after last', () => {
    const item = findNearestItemByPreviewTop(sampleMap, 500);
    expect(item).not.toBeNull();
    expect(item!.sourceStartLine).toBe(12);
  });

  it('returns null for empty map', () => {
    const item = findNearestItemByPreviewTop([], 0);
    expect(item).toBeNull();
  });
});
