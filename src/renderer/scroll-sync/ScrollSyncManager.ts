import type { EditorAPI, PreviewAPI, ScrollMap } from './types';
import { buildScrollMap } from './buildScrollMap';
import { findNearestItemBySourceLine, findNearestItemByPreviewTop } from './findScrollMapItem';
import { rafThrottle } from './rafThrottle';

export type { EditorAPI, PreviewAPI, ScrollMap };

/**
 * Coordinates bidirectional scroll sync between editor and preview.
 *
 * Uses a syncing lock to prevent infinite loops. Scroll events are
 * throttled via requestAnimationFrame. Listeners are attached lazily
 * — the preview scroll element may not exist until the iframe is populated.
 */
export class ScrollSyncManager {
  private editor: EditorAPI;
  private preview: PreviewAPI;
  private syncing = false;
  private enabled = false;
  private scrollMap: ScrollMap = [];
  private editorScrollEl: HTMLElement | null = null;
  private previewScrollEl: HTMLElement | null = null;
  private editorListenerAttached = false;
  private previewListenerAttached = false;

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
    this.attachListeners();
    this.refresh();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.detachListeners();
  }

  /** Rebuild the ScrollMap from the preview DOM. Also ensures listeners are attached. */
  refresh(): void {
    if (!this.enabled) return;

    // Lazy-attach listeners in case preview element wasn't ready at enable() time
    this.attachListeners();

    const previewEl = this.preview.getScrollElement();
    if (!previewEl) {
      this.scrollMap = [];
      return;
    }
    this.scrollMap = buildScrollMap(previewEl);
  }

  private attachListeners(): void {
    // Editor listener (usually ready immediately)
    if (!this.editorListenerAttached) {
      this.editorScrollEl = this.editor.getScrollElement();
      if (this.editorScrollEl) {
        this.editorScrollEl.addEventListener('scroll', this.handleEditorScroll, { passive: true });
        this.editorListenerAttached = true;
      }
    }

    // Preview listener (may need retry — iframe not populated yet)
    if (!this.previewListenerAttached) {
      this.previewScrollEl = this.preview.getScrollElement();
      if (this.previewScrollEl) {
        this.previewScrollEl.addEventListener('scroll', this.handlePreviewScroll, { passive: true });
        this.previewListenerAttached = true;
      }
    }
  }

  private detachListeners(): void {
    if (this.editorScrollEl && this.editorListenerAttached) {
      this.editorScrollEl.removeEventListener('scroll', this.handleEditorScroll);
      this.editorListenerAttached = false;
    }
    if (this.previewScrollEl && this.previewListenerAttached) {
      this.previewScrollEl.removeEventListener('scroll', this.handlePreviewScroll);
      this.previewListenerAttached = false;
    }
  }

  // ---- Sync logic ----

  syncEditorToPreview(): void {
    if (this.syncing) return;
    if (this.scrollMap.length === 0) return;

    this.syncing = true;

    try {
      const editorLine = this.editor.getTopVisibleLine(); // 0-based
      const sourceLine = editorLine + 1; // convert to 1-based for ScrollMap
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

      // Convert 1-based source line to 0-based editor line
      this.editor.scrollToLine(Math.round(sourceLine) - 1);
    } finally {
      requestAnimationFrame(() => {
        this.syncing = false;
      });
    }
  }
}
