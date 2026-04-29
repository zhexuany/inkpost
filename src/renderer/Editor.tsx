import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';

export interface EditorHandle {
  jumpToLine: (lineIndex: number) => void;
}

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll?: (ratio: number) => void;
  externalScrollRatio?: number;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ value, onChange, onScroll, externalScrollRatio }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isSyncingScroll = useRef(false);
  const isSettingValue = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  useImperativeHandle(ref, () => ({
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

    const scrollListener = EditorView.domEventHandlers({
      scroll() {
        if (isSyncingScroll.current) return;
        const el = viewRef.current?.scrollDOM;
        if (!el) return;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll <= 0) return;
        onScrollRef.current?.(el.scrollTop / maxScroll);
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
        updateListener,
        scrollListener,
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

  // Sync from external scroll ratio
  useEffect(() => {
    if (externalScrollRatio === undefined) return;
    const view = viewRef.current;
    if (!view) return;
    isSyncingScroll.current = true;
    const el = view.scrollDOM;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = externalScrollRatio * maxScroll;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, [externalScrollRatio]);

  return <div ref={containerRef} className="cm-editor-wrapper" />;
});

Editor.displayName = 'Editor';
export default Editor;
