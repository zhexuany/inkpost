import type { EditorAPI, PreviewAPI, ScrollMap } from './types';
import { buildScrollMap } from './buildScrollMap';
import { findNearestItemBySourceLine, findNearestItemByPreviewTop } from './findScrollMapItem';
import { rafThrottle } from './rafThrottle';

export type { EditorAPI, PreviewAPI, ScrollMap };

/**
 * Coordinates bidirectional scroll sync between editor and preview.
 *
 * Uses a syncing lock to prevent infinite loops. Scroll events are
 * throttled via requestAnimationFrame.
 *
 * IMPORTANT: the preview lives in an iframe. The scrollable element is
 * `documentElement` (for reading/setting scrollTop), but the `scroll`
 * event fires on `document`. We must listen on `document`, not the
 * scrolling element itself.
 */
export class ScrollSyncManager {
  private editor: EditorAPI;
  private preview: PreviewAPI;
  private syncing = false;
  private enabled = false;
  private scrollMap: ScrollMap = [];

  // Cached DOM references for change detection
  private editorScrollEl: HTMLElement | null = null;
  private previewScrollEl: HTMLElement | null = null;   // scrollTop target
  private previewDoc: Document | null = null;             // scroll event target

  private handleEditorScroll: () => void;
  private handlePreviewScroll: () => void;

  constructor(editor: EditorAPI, preview: PreviewAPI) {
    this.editor = editor;
    this.preview = preview;

    this.handleEditorScroll = rafThrottle(() => this.syncEditorToPreview());
    this.handlePreviewScroll = rafThrottle(() => this.syncPreviewToEditor());
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.ensureListeners();
    this.rebuildScrollMap();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.removeAllListeners();
    this.scrollMap = [];
  }

  /** Rebuild ScrollMap and re-attach listeners if DOM was replaced (e.g. iframe doc.write). */
  refresh(): void {
    if (!this.enabled) return;
    this.ensureListeners();
    this.rebuildScrollMap();
  }

  // ---- Internal ----

  private ensureListeners(): void {
    // --- Editor ---
    const editorEl = this.editor.getScrollElement();
    if (editorEl && editorEl !== this.editorScrollEl) {
      if (this.editorScrollEl) {
        this.editorScrollEl.removeEventListener('scroll', this.handleEditorScroll);
      }
      this.editorScrollEl = editorEl;
      this.editorScrollEl.addEventListener('scroll', this.handleEditorScroll, { passive: true });
    } else if (!this.editorScrollEl && editorEl) {
      this.editorScrollEl = editorEl;
      this.editorScrollEl.addEventListener('scroll', this.handleEditorScroll, { passive: true });
    }

    // --- Preview ---
    const previewEl = this.preview.getScrollElement();     // documentElement — for scrollTop
    const previewDoc = previewEl?.ownerDocument ?? null;    // document — for scroll events

    if (previewDoc && previewDoc !== this.previewDoc) {
      // Document was replaced (iframe doc.write). Remove old listener, attach to new.
      if (this.previewDoc) {
        this.previewDoc.removeEventListener('scroll', this.handlePreviewScroll);
      }
      this.previewDoc = previewDoc;
      this.previewDoc.addEventListener('scroll', this.handlePreviewScroll, { passive: true });
      this.previewScrollEl = previewEl;
    } else if (!this.previewDoc && previewDoc) {
      // First time
      this.previewDoc = previewDoc;
      this.previewDoc.addEventListener('scroll', this.handlePreviewScroll, { passive: true });
      this.previewScrollEl = previewEl;
    } else if (previewEl && previewEl !== this.previewScrollEl) {
      // documentElement changed but document is the same (shouldn't normally happen)
      this.previewScrollEl = previewEl;
    }
  }

  private rebuildScrollMap(): void {
    const previewEl = this.preview.getScrollElement();
    if (!previewEl) {
      this.scrollMap = [];
      return;
    }
    this.scrollMap = buildScrollMap(previewEl);
  }

  private removeAllListeners(): void {
    if (this.editorScrollEl) {
      this.editorScrollEl.removeEventListener('scroll', this.handleEditorScroll);
      this.editorScrollEl = null;
    }
    if (this.previewDoc) {
      this.previewDoc.removeEventListener('scroll', this.handlePreviewScroll);
      this.previewDoc = null;
    }
    this.previewScrollEl = null;
  }

  // ---- Sync logic ----

  syncEditorToPreview(): void {
    if (this.syncing) return;
    if (this.scrollMap.length === 0) return;

    this.syncing = true;

    try {
      const editorLine = this.editor.getTopVisibleLine(); // 0-based
      const sourceLine = editorLine + 1;
      const item = findNearestItemBySourceLine(this.scrollMap, sourceLine);
      if (!item) return;

      const progress =
        (sourceLine - item.sourceStartLine) /
        Math.max(1, item.sourceEndLine - item.sourceStartLine);
      const targetTop = item.previewTop + Math.max(0, Math.min(1, progress)) * item.previewHeight;

      const el = this.preview.getScrollElement();
      if (el) {
        el.scrollTop = Math.max(0, targetTop);
      }
    } finally {
      requestAnimationFrame(() => {
        this.syncing = false;
      });
    }
  }

  syncPreviewToEditor(): void {
    if (this.syncing) return;
    if (this.scrollMap.length === 0) return;

    this.syncing = true;

    try {
      const el = this.preview.getScrollElement();
      if (!el) return;

      const scrollTop = el.scrollTop;
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

      this.editor.scrollToLine(Math.round(sourceLine) - 1);
    } finally {
      requestAnimationFrame(() => {
        this.syncing = false;
      });
    }
  }
}
