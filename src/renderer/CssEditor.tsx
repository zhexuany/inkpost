import React, { useCallback } from 'react';

interface CssEditorProps {
  css: string;
  onChange: (css: string) => void;
}

export default function CssEditor({ css, onChange }: CssEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="css-editor">
      <div className="css-editor-header">CSS 样式</div>
      <textarea
        className="css-textarea"
        value={css}
        onChange={handleChange}
        spellCheck={false}
      />
    </div>
  );
}
