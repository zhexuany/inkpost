import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { rafThrottle } from './scroll-sync/rafThrottle';
import { getPhrases } from './cmPhrases';

export interface EditorHandle {
  /** Get the 0-based line number of the first visible line in the viewport */
  getTopVisibleLine(): number;
  /** Scroll so that the given 0-based line is at the top of the viewport */
  scrollToLine(line: number): void;
  /** Get the scrollable DOM element */
  getScrollElement(): HTMLElement | null;
  /** Jump to a line and focus (0-based) */
  jumpToLine(lineIndex: number): void;
}

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onTopLineChange?: (line: number) => void;
  targetScrollLine?: number;
  lang?: string;
  fileDir?: string;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ value, onChange, onTopLineChange, targetScrollLine, lang, fileDir }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isSyncingScroll = useRef(false);
    const isSettingValue = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onTopLineChangeRef = useRef(onTopLineChange);
    onTopLineChangeRef.current = onTopLineChange;
    const phrasesCompartment = useRef(new Compartment());

    const getTopVisibleLine = useCallback((): number => {
      const view = viewRef.current;
      if (!view) return 0;
      const scrollTop = view.scrollDOM.scrollTop;
      // Get the line block at the current scroll position
      const lineBlock = view.lineBlockAtHeight(scrollTop);
      if (!lineBlock) return 0;
      // Convert from 1-based CodeMirror line to 0-based
      return view.state.doc.lineAt(lineBlock.from).number - 1;
    }, []);

    const doScrollToLine = useCallback((line: number) => {
      const view = viewRef.current;
      if (!view) return;
      const doc = view.state.doc;
      const targetLine = doc.line(Math.min(line + 1, doc.lines));
      isSyncingScroll.current = true;
      view.dispatch({
        effects: EditorView.scrollIntoView(targetLine.from, { y: 'start' }),
      });
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }, []);

    useImperativeHandle(ref, () => ({
      getTopVisibleLine,
      scrollToLine: doScrollToLine,
      getScrollElement: () => viewRef.current?.scrollDOM ?? null,
      jumpToLine(lineIndex: number) {
        const view = viewRef.current;
        if (!view) return;
        const line = view.state.doc.line(Math.min(lineIndex + 1, view.state.doc.lines));
        view.dispatch({
          selection: { anchor: line.from },
          scrollIntoView: true,
        });
        view.focus();
      },
    }));

    // Create EditorView once
    useEffect(() => {
      if (!containerRef.current) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !isSettingValue.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      });

      const scrollHandler = rafThrottle(() => {
        if (isSyncingScroll.current) return;
        const view = viewRef.current;
        if (!view) return;
        const scrollTop = view.scrollDOM.scrollTop;
        const lineBlock = view.lineBlockAtHeight(scrollTop);
        if (!lineBlock) return;
        const line = view.state.doc.lineAt(lineBlock.from).number - 1;
        onTopLineChangeRef.current?.(line);
      });

      const scrollListener = EditorView.domEventHandlers({
        scroll() {
          scrollHandler();
        },
      });

      const pasteListener = EditorView.domEventHandlers({
        paste(event, view) {
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const blob = item.getAsFile();
              if (!blob) continue;

              const reader = new FileReader();
              reader.onload = async () => {
                const buffer = new Uint8Array(reader.result as ArrayBuffer);
                try {
                  const filePath = await window.inkpost.pasteImage(
                    Array.from(buffer),
                    fileDir,
                  );
                  const pos = view.state.selection.main.from;
                  const filename = filePath.split(/[/\\]/).pop() ?? 'image';
                  view.dispatch({
                    changes: { from: pos, insert: `![${filename}](${filePath})\n` },
                  });
                } catch (err) {
                  console.error('Image paste failed:', err);
                }
              };
              reader.readAsArrayBuffer(blob);
              return true;
            }
          }
          return false;
        },
      });

      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          foldGutter(),
          drawSelection(),
          EditorState.allowMultipleSelections.of(true),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          markdown({ base: markdownLanguage }),
          highlightActiveLine(),
          highlightSelectionMatches(),
          closeBrackets(),
          autocompletion(),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          oneDark,
          phrasesCompartment.current.of(EditorState.phrases.of(getPhrases())),
          updateListener,
          scrollListener,
          pasteListener,
          EditorView.theme({
            '&': { height: '100%', fontSize: '14px' },
            '.cm-scroller': { overflow: 'auto', fontFamily: '"SF Mono", Menlo, Consolas, monospace' },
            '.cm-content': { padding: '8px 0' },
            '.cm-gutters': { borderRight: '1px solid #333' },
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });
      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external value changes
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentDoc = view.state.doc.toString();
      if (currentDoc === value) return;
      isSettingValue.current = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
      isSettingValue.current = false;
    }, [value]);

    // Sync external scroll-to-line command
    useEffect(() => {
      if (targetScrollLine === undefined) return;
      doScrollToLine(targetScrollLine);
    }, [targetScrollLine, doScrollToLine]);

    // Reconfigure phrases when language changes
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: phrasesCompartment.current.reconfigure(
          EditorState.phrases.of(getPhrases()),
        ),
      });
    }, [lang]);

    return <div ref={containerRef} className="cm-editor-wrapper" />;
  },
);

Editor.displayName = 'Editor';
export default Editor;
