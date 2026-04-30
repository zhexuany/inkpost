import { useRef, useCallback } from 'react';
import { ScrollSyncManager } from '../scroll-sync/ScrollSyncManager';
import type { EditorHandle } from '../Editor';
import type { PreviewHandle } from '../Preview';

/**
 * Hook that creates a ScrollSyncManager and wires it to Editor and Preview refs.
 * The actual scroll event handling happens in Editor and Preview components;
 * ScrollSyncManager provides pure coordination without DOM listeners.
 */
export function useScrollSync(
  editorRef: React.RefObject<EditorHandle | null>,
  previewRef: React.RefObject<PreviewHandle | null>,
) {
  const managerRef = useRef<ScrollSyncManager>(new ScrollSyncManager());
  const pendingRestoreLine = useRef<number | null>(null);

  /** Save the current editor top line for restoration after content re-render. */
  const captureEditorLine = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      pendingRestoreLine.current = editor.getTopVisibleLine();
    }
  }, [editorRef]);

  /** Called when editor scrolls. topLine is 0-based. */
  const onEditorScroll = useCallback((topLine: number) => {
    const m = managerRef.current;
    const preview = previewRef.current;
    if (!preview) return;
    m.syncEditorToPreview(topLine, () => preview.getScrollElement());
  }, [previewRef]);

  /** Called when preview scrolls. offset is the scrollTop value. */
  const onPreviewScroll = useCallback((offset: number) => {
    const m = managerRef.current;
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    m.syncPreviewToEditor(
      offset,
      () => preview.getScrollElement(),
      (line) => editor.scrollToLine(line),
    );
  }, [editorRef, previewRef]);

  /** Called when preview content changes — rebuild ScrollMap and restore position. */
  const onScrollMapReady = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const el = preview.getScrollElement();
    if (!el) return;
    managerRef.current.refresh(el);

    // Restore preview position to match the editor line saved before re-render
    if (pendingRestoreLine.current !== null) {
      const line = pendingRestoreLine.current;
      pendingRestoreLine.current = null;
      managerRef.current.syncEditorToPreview(line, () => el);
    }
  }, [previewRef]);

  return { onEditorScroll, onPreviewScroll, onScrollMapReady, captureEditorLine };
}
