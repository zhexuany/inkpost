import React, { useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

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
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingScroll = useRef(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  // Emit scroll ratio to parent
  const handleScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    const ta = taRef.current;
    if (!ta || !onScroll) return;
    const maxScroll = ta.scrollHeight - ta.clientHeight;
    if (maxScroll <= 0) return;
    onScroll(ta.scrollTop / maxScroll);
  }, [onScroll]);

  // Sync from external scroll ratio (preview → editor)
  useEffect(() => {
    if (externalScrollRatio === undefined) return;
    const ta = taRef.current;
    if (!ta) return;
    isSyncingScroll.current = true;
    const maxScroll = ta.scrollHeight - ta.clientHeight;
    ta.scrollTop = externalScrollRatio * maxScroll;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, [externalScrollRatio]);

  // Expose jumpToLine via ref
  useImperativeHandle(ref, () => ({
    jumpToLine: (lineIndex: number) => {
      const ta = taRef.current;
      if (!ta) return;
      // Calculate character offset for the target line
      const lines = value.split('\n');
      let offset = 0;
      for (let i = 0; i < lineIndex && i < lines.length; i++) {
        offset += lines[i].length + 1; // +1 for \n
      }
      // Set cursor position
      ta.focus();
      ta.selectionStart = ta.selectionEnd = offset;
      // Scroll the line into view
      const lineHeight = 22; // approx line-height * font-size
      const targetScroll = lineIndex * lineHeight - ta.clientHeight / 3;
      isSyncingScroll.current = true;
      ta.scrollTop = Math.max(0, targetScroll);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    },
  }));

  return (
    <textarea
      ref={taRef}
      className="md-textarea"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      spellCheck={false}
    />
  );
});

Editor.displayName = 'Editor';
export default Editor;
