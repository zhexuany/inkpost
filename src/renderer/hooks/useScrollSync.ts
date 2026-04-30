import { useEffect, useRef, useCallback } from 'react';
import { ScrollSyncManager } from '../scroll-sync/ScrollSyncManager';
import type { EditorHandle } from '../Editor';
import type { PreviewHandle } from '../Preview';

export function useScrollSync(
  editorRef: React.RefObject<EditorHandle | null>,
  previewRef: React.RefObject<PreviewHandle | null>,
) {
  const managerRef = useRef<ScrollSyncManager | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    const manager = new ScrollSyncManager(
      {
        getTopVisibleLine: () => editor.getTopVisibleLine(),
        scrollToLine: (line: number) => editor.scrollToLine(line),
        getScrollElement: () => editor.getScrollElement(),
      },
      {
        getScrollElement: () => preview.getScrollElement(),
        getScrollMap: () => preview.getScrollMap(),
      },
    );

    managerRef.current = manager;
    manager.enable();

    return () => {
      manager.disable();
      managerRef.current = null;
    };
  }, [editorRef, previewRef]);

  const refresh = useCallback(() => {
    managerRef.current?.refresh();
  }, []);

  return { refresh };
}
