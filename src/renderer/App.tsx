import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor from './Editor';
import Preview from './Preview';
import CssEditor from './CssEditor';
import StatusBar from './StatusBar';
import { presetThemes } from '../shared/presets';
import { scanCSS, type CSSWarning } from '../shared/css-scanner';
import type { RenderResult, InkPostTheme } from '../shared/types';

const SAMPLE_MD = `# 欢迎使用墨帖 InkPost

这是一个 **Markdown** 写作工具，帮助你用优雅的方式撰写微信公众号文章。

## 功能特性

- Markdown 语法写作
- 自定义 CSS 主题
- 本地图片自动处理
- 一键复制到公众号后台

> 用 Markdown 写作，用样式表达态度。

## 快速开始

1. 在左侧编辑器中编写 Markdown 内容
2. 在右侧预览区查看效果
3. 点击底部 **复制到剪贴板** 按钮
4. 到微信公众号后台 Ctrl+V 粘贴

### 代码示例

\`\`\`python
def hello():
    print("Hello, InkPost!")
\`\`\`

---

*由墨帖 InkPost 驱动*
`;

export default function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [themes, setThemes] = useState<InkPostTheme[]>(presetThemes);
  const [activeThemeId, setActiveThemeId] = useState<string>(presetThemes[0].id);
  const [showCssPanel, setShowCssPanel] = useState(false);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [cssWarnings, setCssWarnings] = useState<CSSWarning[]>([]);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const activeTheme = themes.find(t => t.id === activeThemeId) ?? themes[0];

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      try {
        const savedThemes = await window.inkpost.getThemes();
        const savedId = await window.inkpost.getActiveThemeId();
        // Merge: preset themes + custom themes from store
        const customThemes = savedThemes.filter(t => !presetThemes.some(p => p.id === t.id));
        setThemes([...presetThemes, ...customThemes]);
        setActiveThemeId(savedId);
      } catch { /* first launch, use defaults */ }
    })();
  }, []);

  // Scan CSS for warnings when theme changes
  useEffect(() => {
    const warnings = scanCSS(activeTheme.css);
    setCssWarnings(warnings);
  }, [activeTheme.css]);

  // Debounced rendering
  useEffect(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => {
      doRender();
    }, 300);
    return () => {
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
  }, [markdown, activeTheme.css]);

  const doRender = async () => {
    try {
      setIsRendering(true);
      const result = await window.inkpost.renderMarkdown({
        markdown,
        css: activeTheme.css,
        filePath: currentFilePath ?? undefined,
      });
      setRenderResult(result);
    } catch (err) {
      console.error('Render failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyClick = useCallback(() => {
    if (!renderResult) return;
    setShowCopyModal(true);
  }, [renderResult]);

  const handleConfirmCopy = useCallback(async () => {
    if (!renderResult) return;
    await window.inkpost.copyToClipboard(renderResult.html);
    setShowCopyModal(false);
  }, [renderResult]);

  const handleOpen = useCallback(async () => {
    await window.inkpost.openFile();
  }, []);

  const handleSave = useCallback(async () => {
    if (currentFilePath) {
      await window.inkpost.saveFile(currentFilePath, markdown);
    } else {
      const newPath = await window.inkpost.saveFileAs(markdown);
      if (newPath) setCurrentFilePath(newPath);
    }
  }, [currentFilePath, markdown]);

  const handleThemeChange = useCallback(async (id: string) => {
    setActiveThemeId(id);
    try { await window.inkpost.setActiveThemeId(id); } catch {}
  }, []);

  const handleCssChange = useCallback((css: string) => {
    setThemes(prev => prev.map(t => t.id === activeThemeId ? { ...t, css } : t));
  }, [activeThemeId]);

  // Listen for file opened from menu
  useEffect(() => {
    window.inkpost.onFileOpened((data) => {
      setMarkdown(data.content);
      setCurrentFilePath(data.path);
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        handleCopyClick();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopyClick, handleSave]);

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-left">
          <button onClick={handleOpen} title="打开文件 (Ctrl+O)">打开</button>
          <button onClick={handleSave} title="保存 (Ctrl+S)">保存</button>
          <span className="file-name">
            {currentFilePath ? currentFilePath.split(/[/\\]/).pop() : '未保存'}
          </span>
        </div>
        <div className="toolbar-right">
          <select
            value={activeThemeId}
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={() => setShowCssPanel(!showCssPanel)}>
            {showCssPanel ? '隐藏样式' : '编辑样式'}
          </button>
          <button className="copy-btn" onClick={handleCopyClick} title="复制到剪贴板 (Ctrl+Shift+C)">
            复制
          </button>
        </div>
      </div>

      <div className="main-area">
        <div className="editor-pane">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>

        {showCssPanel && (
          <div className="css-pane">
            <CssEditor css={activeTheme.css} onChange={handleCssChange} />
            {cssWarnings.length > 0 && (
              <div className="css-warnings">
                {cssWarnings.map((w, i) => (
                  <div key={i}>行{w.line}: {w.prop}{w.value ? `: ${w.value}` : ''} — {w.reason}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="preview-pane">
          <Preview html={renderResult?.html ?? ''} />
        </div>
      </div>

      <StatusBar
        wordCount={renderResult?.wordCount ?? 0}
        imageCount={renderResult?.imageCount ?? 0}
        totalSizeKB={renderResult?.totalSizeKB ?? 0}
        warnings={renderResult?.warnings ?? []}
        isRendering={isRendering}
      />

      {showCopyModal && renderResult && (
        <div className="modal-overlay" onClick={() => setShowCopyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>确认复制</span>
              {renderResult.totalSizeKB > 5120 && (
                <span className="warning">大小 {renderResult.totalSizeKB}KB，可能粘贴失败</span>
              )}
            </div>
            <div className="modal-body">
              <Preview html={renderResult.html} />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCopyModal(false)}>取消</button>
              <button className="confirm" onClick={handleConfirmCopy}>确认复制</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
