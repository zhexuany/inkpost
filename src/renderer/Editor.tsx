import React, { useCallback, useRef, useEffect } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  // Auto-resize and handle tab key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newVal);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  // Maintain scroll position on external value changes (file open)
  useEffect(() => {
    if (ref.current && ref.current.value !== value) {
      const scrollTop = ref.current.scrollTop;
      // value is already updated by parent, just restore scroll
      requestAnimationFrame(() => {
        if (ref.current) ref.current.scrollTop = scrollTop;
      });
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="md-textarea"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  );
}
