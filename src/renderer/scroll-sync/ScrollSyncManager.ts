import type { ScrollMap } from './types';
import { buildScrollMap } from './buildScrollMap';
import { findNearestItemBySourceLine, findNearestItemByPreviewTop } from './findScrollMapItem';

export type { ScrollMap };

/**
 * Pure coordination logic for bidirectional scroll sync.
 *
 * Does NOT attach its own DOM listeners. Instead, Editor and Preview
 * components call syncEditorToPreview / syncPreviewToEditor from their
 * own scroll handlers, passing the current position.
 */
export class ScrollSyncManager {
  private scrollMap: ScrollMap = [];
  private syncing = false;

  /** Get the current scroll map (for external reading). */
  getScrollMap(): ScrollMap {
    return this.scrollMap;
  }

  /** Rebuild the ScrollMap from the preview DOM element. */
  refresh(scrollContainer: HTMLElement): void {
    this.scrollMap = buildScrollMap(scrollContainer);
  }

  /**
   * Sync editor → preview.
   * @param editorLine 0-based top visible line in the editor
   * @param getPreviewScrollEl callback to get the preview scroll element
   * @param setPreviewScroll callback to set the preview scroll position
   */
  syncEditorToPreview(
    editorLine: number,
    getPreviewScrollEl: () => HTMLElement | null,
  ): void {
    if (this.syncing) return;
    if (this.scrollMap.length === 0) return;

    this.syncing = true;

    try {
      const sourceLine = editorLine + 1; // 0-based → 1-based
      const item = findNearestItemBySourceLine(this.scrollMap, sourceLine);
      if (!item) return;

      const progress =
        (sourceLine - item.sourceStartLine) /
        Math.max(1, item.sourceEndLine - item.sourceStartLine);
      const targetTop =
        item.previewTop + Math.max(0, Math.min(1, progress)) * item.previewHeight;

      const el = getPreviewScrollEl();
      if (el) {
        el.scrollTop = Math.max(0, targetTop);
      }
    } finally {
      requestAnimationFrame(() => {
        this.syncing = false;
      });
    }
  }

  /**
   * Sync preview → editor.
   * @param previewScrollTop current scrollTop of the preview container
   * @param getPreviewScrollEl callback to get the preview scroll element
   * @param scrollEditorToLine callback to scroll the editor to a given 0-based line
   */
  syncPreviewToEditor(
    previewScrollTop: number,
    getPreviewScrollEl: () => HTMLElement | null,
    scrollEditorToLine: (line: number) => void,
  ): void {
    if (this.syncing) return;
    if (this.scrollMap.length === 0) return;

    this.syncing = true;

    try {
      const el = getPreviewScrollEl();
      if (!el) return;

      const scrollTop = previewScrollTop;
      const item = findNearestItemByPreviewTop(this.scrollMap, scrollTop);
      if (!item) return;

      const progress =
        item.previewHeight > 0
          ? (scrollTop - item.previewTop) / item.previewHeight
          : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const sourceLine =
        item.sourceStartLine +
        clampedProgress * Math.max(1, item.sourceEndLine - item.sourceStartLine);

      scrollEditorToLine(Math.round(sourceLine) - 1); // 1-based → 0-based
    } finally {
      requestAnimationFrame(() => {
        this.syncing = false;
      });
    }
  }
}
