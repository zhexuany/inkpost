import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { type EditorHandle } from './Editor';
import Preview, { type PreviewHandle } from './Preview';
import CssEditor from './CssEditor';
import StatusBar from './StatusBar';
import ThemeManager from './ThemeManager';
import { presetThemes } from '../shared/presets';
import { scanCSS, type CSSWarning } from '../shared/css-scanner';
import type { RenderResult, InkPostTheme } from '../shared/types';
import { t, setLang, getLang, type Lang } from '../shared/i18n';
import { useScrollSync } from './hooks/useScrollSync';
import { useResizeRefresh } from './hooks/useResizeRefresh';

const SAMPLE_MD = `# 欢迎使用墨帖 InkPost

这是一个 **Markdown** 写作工具，帮助你用优雅的方式撰写微信公众号文章。

## 功能特性

- Markdown 语法写作
- 自定义 CSS 主题
- 本地图片自动处理
- 一键复制到公众号后台
- LaTeX 数学公式（SVG 渲染）
- 自定义容器块

> 用 Markdown 写作，用样式表达态度。

## 快速开始

1. 在左侧编辑器中编写 Markdown 内容
2. 在右侧预览区查看效果
3. 点击底部 **复制到剪贴板** 按钮
4. 到微信公众号后台 Ctrl+V 粘贴

### LaTeX 公式

行内公式：$E = mc^2$

行间公式：

$$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

### 自定义容器块

::: block-1
这是信息提示模块，适合展示注意事项和补充说明。
:::

::: block-2
这是核心观点模块，适合突出关键信息。
:::

::: block-3
这是强调模块，适合引用资料或突出展示。
:::

::: info
这是信息提示，适合展示注意事项。
:::

::: tip
这是建议提示，适合分享技巧和推荐。
:::

::: warning
这是警告提示，适合提醒需要注意的问题。
:::

::: danger
这是危险提示，适合警示重要风险和注意事项。
:::

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
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [showRecentMenu, setShowRecentMenu] = useState(false);
  const [lang, setLangState] = useState<Lang>(getLang());
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [contentHistory, setContentHistory] = useState<{ id: string; content: string; filePath: string | null; timestamp: number }[]>([]);
  const [showContentHistory, setShowContentHistory] = useState(false);
  const [cssWarnings, setCssWarnings] = useState<CSSWarning[]>([]);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);

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

        // Crash recovery: check for saved draft
        const draft = await window.inkpost.loadDraft();
        if (draft && draft.content) {
          const age = Math.round((Date.now() - draft.timestamp) / 1000);
          const confirmed = window.confirm(
            `检测到未保存的草稿（${age} 秒前），是否恢复？`
          );
          if (confirmed) {
            setMarkdown(draft.content);
            if (draft.filePath) setCurrentFilePath(draft.filePath);
          }
          await window.inkpost.clearDraft();
        }

        // Load recent files
        const files = await window.inkpost.getRecentFiles();
        setRecentFiles(files);

        // Load content history
        const history = await window.inkpost.getContentHistory();
        setContentHistory(history);
      } catch { /* first launch, use defaults */ }
    })();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      window.inkpost.saveDraft({ content: markdown, filePath: currentFilePath });
    }, 30000);
    return () => clearInterval(timer);
  }, [markdown, currentFilePath]);

  // Scan CSS for warnings when theme changes
  useEffect(() => {
    const warnings = scanCSS(activeTheme.css);
    setCssWarnings(warnings);
  }, [activeTheme.css]);

  // Debounced rendering
  useEffect(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => {
      captureEditorLine();
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
      await window.inkpost.clearDraft();
    } else {
      const newPath = await window.inkpost.saveFileAs(markdown);
      if (newPath) {
        setCurrentFilePath(newPath);
        await window.inkpost.clearDraft();
      }
    }
    // Save content snapshot
    await window.inkpost.saveContentSnapshot({ content: markdown, filePath: currentFilePath });
    const history = await window.inkpost.getContentHistory();
    setContentHistory(history);
  }, [currentFilePath, markdown]);

  const hasEditedCss = useRef(false);

  const handleThemeChange = useCallback(async (id: string) => {
    hasEditedCss.current = false;
    setActiveThemeId(id);
    try { await window.inkpost.setActiveThemeId(id); } catch {}
  }, []);

  const reloadThemes = useCallback(async () => {
    const savedThemes = await window.inkpost.getThemes();
    const savedId = await window.inkpost.getActiveThemeId();
    const customThemes = savedThemes.filter(t => !presetThemes.some(p => p.id === t.id));
    setThemes([...presetThemes, ...customThemes]);
    setActiveThemeId(savedId);
  }, []);

  const handleCssChange = useCallback((css: string) => {
    hasEditedCss.current = true;
    setThemes(prev => prev.map(t => t.id === activeThemeId ? { ...t, css } : t));
  }, [activeThemeId]);

  // Auto-save edited CSS to store (debounced)
  useEffect(() => {
    if (!hasEditedCss.current) return;
    const timer = setTimeout(() => {
      const theme = themes.find(t => t.id === activeThemeId);
      if (theme) window.inkpost.saveTheme(theme);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTheme?.css, activeThemeId, themes]);

  const handleJumpToLine = useCallback((lineIndex: number) => {
    editorRef.current?.jumpToLine(lineIndex);
  }, []);

  // Scroll sync via ScrollSyncManager
  const { onEditorScroll, onPreviewScroll, onScrollMapReady, captureEditorLine } = useScrollSync(editorRef, previewRef);

  // Refresh ScrollMap when content changes (images, layout shifts)
  useResizeRefresh(previewRef, onScrollMapReady, !!renderResult);

  // Listen for file opened from menu
  useEffect(() => {
    window.inkpost.onFileOpened(async (data) => {
      setMarkdown(data.content);
      setCurrentFilePath(data.path);
      await window.inkpost.addRecentFile(data.path);
      const files = await window.inkpost.getRecentFiles();
      setRecentFiles(files);
    });
  }, []);

  const handleOpenRecent = useCallback(async (filePath: string) => {
    setShowRecentMenu(false);
    try {
      const content = await window.inkpost.readFile(filePath);
      setMarkdown(content);
      setCurrentFilePath(filePath);
      await window.inkpost.addRecentFile(filePath);
      const files = await window.inkpost.getRecentFiles();
      setRecentFiles(files);
    } catch { /* file may have been deleted */ }
  }, []);

  const handleLangChange = useCallback(() => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    setLangState(next);
  }, [lang]);

  const handleRestoreFromHistory = useCallback(async (id: string) => {
    const entry = await window.inkpost.getContentHistoryEntry(id);
    if (entry) {
      setMarkdown(entry.content);
      if (entry.filePath) setCurrentFilePath(entry.filePath);
    }
    setShowContentHistory(false);
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
          <button onClick={handleOpen} title="Ctrl+O">{t('toolbar.open')}</button>
          <div className="recent-wrapper">
            <button onClick={() => setShowRecentMenu(!showRecentMenu)}>
              {t('toolbar.recent')}
            </button>
            {showRecentMenu && recentFiles.length > 0 && (
              <div className="recent-menu">
                {recentFiles.map((f, i) => (
                  <div key={i} className="recent-item" onClick={() => handleOpenRecent(f)}>
                    {f.split(/[/\\]/).pop()}
                    <span className="recent-path">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSave} title="Ctrl+S">{t('toolbar.save')}</button>
          <span className="file-name">
            {currentFilePath ? currentFilePath.split(/[/\\]/).pop() : t('toolbar.unsaved')}
          </span>
        </div>
        <div className="toolbar-right">
          <ThemeManager
            themes={themes}
            activeThemeId={activeThemeId}
            onSwitchTheme={handleThemeChange}
            onThemesChanged={reloadThemes}
          />
          <button onClick={() => setShowCssPanel(!showCssPanel)}>
            {showCssPanel ? t('toolbar.hideStyle') : t('toolbar.editStyle')}
            {cssWarnings.length > 0 && (
              <span className="warn-badge">{cssWarnings.length}</span>
            )}
          </button>
          <button className="copy-btn" onClick={handleCopyClick} title="Ctrl+Shift+C">
            {t('toolbar.copy')}
          </button>
          {contentHistory.length > 0 && (
            <div className="recent-wrapper">
              <button onClick={() => setShowContentHistory(!showContentHistory)}>
                {t('history.title')}
              </button>
              {showContentHistory && (
                <div className="recent-menu">
                  {contentHistory.map((entry) => (
                    <div key={entry.id} className="recent-item" onClick={() => handleRestoreFromHistory(entry.id)}>
                      {entry.content.split('\n')[0].substring(0, 40)}
                      <span className="recent-path">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={handleLangChange} className="lang-btn" title="Toggle language">
            {lang === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </div>

      <div className="main-area">
        <div className="editor-pane">
          <Editor ref={editorRef} value={markdown} onChange={setMarkdown} onTopLineChange={onEditorScroll} lang={lang} />
        </div>

        {showCssPanel && (
          <div className="css-pane">
            <CssEditor css={activeTheme.css} onChange={handleCssChange} lang={lang} />
            {cssWarnings.length > 0 && (
              <div className="css-warnings">
                {cssWarnings.map((w, i) => (
                  <div key={i}>
                    第{w.line}行&nbsp;
                    <strong>{w.prop}{w.value ? `: ${w.value}` : ''}</strong>
                    &nbsp;— {w.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="preview-pane">
          <Preview ref={previewRef} html={renderResult?.html ?? ''} onJumpToLine={handleJumpToLine} onScroll={onPreviewScroll} onScrollMapReady={onScrollMapReady} />
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
