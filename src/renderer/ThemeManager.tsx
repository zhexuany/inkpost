import React, { useState, useRef, useEffect } from 'react';
import type { InkPostTheme } from '../shared/types';

interface ThemeManagerProps {
  themes: InkPostTheme[];
  activeThemeId: string;
  onSwitchTheme: (id: string) => void;
  onThemesChanged: () => void;
}

type DialogAction = 'new' | 'copy' | 'rename' | 'delete' | 'reset';

interface DialogState {
  type: 'input' | 'confirm';
  title: string;
  message?: string;
  defaultValue?: string;
  action: DialogAction;
}

export default function ThemeManager({
  themes,
  activeThemeId,
  onSwitchTheme,
  onThemesChanged,
}: ThemeManagerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const activeTheme = themes.find(t => t.id === activeThemeId);

  const doCreateWithCss = async (name: string, css: string) => {
    const theme = await window.inkpost.createTheme(name);
    await window.inkpost.saveTheme({ ...theme, css });
    await window.inkpost.setActiveThemeId(theme.id);
    onThemesChanged();
  };

  const openInput = (action: DialogAction, title: string, defaultValue: string) => {
    setInputValue(defaultValue);
    setDialog({ type: 'input', title, defaultValue, action });
  };

  const openConfirm = (action: DialogAction, title: string, message: string) => {
    setDialog({ type: 'confirm', title, message, action });
  };

  const handleDialogSubmit = async () => {
    if (!dialog || !activeTheme) return;

    if (dialog.type === 'input') {
      const name = inputValue.trim();
      if (!name) return;

      if (dialog.action === 'new') {
        const theme = await window.inkpost.createTheme(name);
        await window.inkpost.setActiveThemeId(theme.id);
      } else if (dialog.action === 'copy') {
        await doCreateWithCss(name, activeTheme.css);
      } else if (dialog.action === 'rename') {
        await window.inkpost.renameTheme(activeTheme.id, name);
      }
    } else {
      if (dialog.action === 'delete') {
        await window.inkpost.deleteTheme(activeTheme.id);
      } else if (dialog.action === 'reset') {
        await window.inkpost.resetPresetTheme(activeTheme.id);
      }
    }
    setDialog(null);
    setMenuOpen(false);
    onThemesChanged();
  };

  const handleImport = async () => {
    setMenuOpen(false);
    const result = await window.inkpost.importCss();
    if (!result) return;
    await doCreateWithCss(result.name, result.css);
  };

  const handleExport = async () => {
    setMenuOpen(false);
    if (!activeTheme) return;
    await window.inkpost.exportCss(activeTheme.name, activeTheme.css);
  };

  return (
    <div className="theme-manager" ref={menuRef}>
      <select
        value={activeThemeId}
        onChange={(e) => onSwitchTheme(e.target.value)}
      >
        {themes.map(th => (
          <option key={th.id} value={th.id}>
            {th.name}{th.isBuiltIn ? '' : ' *'}
          </option>
        ))}
      </select>

      <button
        className="theme-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        title="主题管理"
      >
        ▾
      </button>

      {menuOpen && (
        <div className="theme-menu">
          <button onClick={() => openInput('new', '新建主题', '')}>新建主题</button>
          <button onClick={() => openInput('copy', '复制主题', `${activeTheme?.name ?? ''} 副本`)}>复制当前主题</button>
          <div className="theme-menu-sep" />
          <button onClick={handleImport}>导入 CSS 文件</button>
          <button onClick={handleExport}>导出 CSS 文件</button>
          <div className="theme-menu-sep" />
          {activeTheme && !activeTheme.isBuiltIn && (
            <>
              <button onClick={() => openInput('rename', '重命名主题', activeTheme.name)}>重命名</button>
              <button onClick={() => openConfirm('delete', '删除主题', `确定删除主题 "${activeTheme.name}"？此操作不可撤销。`)} className="danger">删除</button>
            </>
          )}
          {activeTheme?.isBuiltIn && (
            <button onClick={() => openConfirm('reset', '恢复默认样式', `确定恢复 "${activeTheme.name}" 为默认样式？你的修改将丢失。`)}>恢复默认样式</button>
          )}
        </div>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">{dialog.title}</div>
            <div className="modal-body">
              {dialog.type === 'confirm' ? (
                <p style={{ margin: 0 }}>{dialog.message}</p>
              ) : (
                <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDialogSubmit()} />
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setDialog(null)}>取消</button>
              <button
                className={dialog.action === 'delete' ? 'danger' : 'confirm'}
                onClick={handleDialogSubmit}
              >
                {dialog.action === 'delete' ? '删除' : dialog.action === 'reset' ? '恢复' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
