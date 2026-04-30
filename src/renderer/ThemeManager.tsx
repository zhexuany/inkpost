import React, { useState, useRef, useEffect } from 'react';
import type { InkPostTheme } from '../shared/types';

interface ThemeManagerProps {
  themes: InkPostTheme[];
  activeThemeId: string;
  onSwitchTheme: (id: string) => void;
  onThemesChanged: () => void;
}

export default function ThemeManager({
  themes,
  activeThemeId,
  onSwitchTheme,
  onThemesChanged,
}: ThemeManagerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setRenamingId(null);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const activeTheme = themes.find(t => t.id === activeThemeId);

  const handleNew = async () => {
    setMenuOpen(false);
    const name = window.prompt('主题名称：');
    if (!name?.trim()) return;
    const theme = await window.inkpost.createTheme(name.trim());
    await window.inkpost.setActiveThemeId(theme.id);
    onThemesChanged();
  };

  const handleCopy = async () => {
    setMenuOpen(false);
    if (!activeTheme) return;
    const name = window.prompt('副本名称：', `${activeTheme.name} 副本`);
    if (!name?.trim()) return;
    const theme = await window.inkpost.createTheme(name.trim());
    const saved = { ...theme, css: activeTheme.css };
    await window.inkpost.saveTheme(saved);
    await window.inkpost.setActiveThemeId(saved.id);
    onThemesChanged();
  };

  const handleImport = async () => {
    setMenuOpen(false);
    const result = await window.inkpost.importCss();
    if (!result) return;
    const theme = await window.inkpost.createTheme(result.name);
    const saved = { ...theme, css: result.css };
    await window.inkpost.saveTheme(saved);
    await window.inkpost.setActiveThemeId(saved.id);
    onThemesChanged();
  };

  const handleExport = async () => {
    setMenuOpen(false);
    if (!activeTheme) return;
    await window.inkpost.exportCss(activeTheme.name, activeTheme.css);
  };

  const handleRenameStart = () => {
    if (!activeTheme?.isBuiltIn) {
      setRenamingId(activeThemeId);
      setRenameValue(activeTheme?.name ?? '');
    }
  };

  const handleRenameSubmit = async () => {
    const name = renameValue.trim();
    if (name && renamingId) {
      await window.inkpost.renameTheme(renamingId, name);
      onThemesChanged();
    }
    setRenamingId(null);
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!activeTheme || activeTheme.isBuiltIn) return;
    if (!window.confirm(`确定删除主题 "${activeTheme.name}"？`)) return;
    await window.inkpost.deleteTheme(activeTheme.id);
    onThemesChanged();
  };

  const handleReset = async () => {
    setMenuOpen(false);
    if (!activeTheme?.isBuiltIn) return;
    if (!window.confirm(`确定恢复 "${activeTheme.name}" 为默认样式？你的修改将丢失。`)) return;
    await window.inkpost.resetPresetTheme(activeTheme.id);
    onThemesChanged();
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
          <button onClick={handleNew}>新建主题</button>
          <button onClick={handleCopy}>复制当前主题</button>
          <div className="theme-menu-sep" />
          <button onClick={handleImport}>导入 CSS 文件</button>
          <button onClick={handleExport}>导出 CSS 文件</button>
          <div className="theme-menu-sep" />
          {activeTheme && !activeTheme.isBuiltIn && (
            <>
              <button onClick={handleRenameStart}>重命名</button>
              <button onClick={handleDelete} className="danger">删除</button>
            </>
          )}
          {activeTheme?.isBuiltIn && (
            <button onClick={handleReset}>恢复默认样式</button>
          )}
        </div>
      )}

      {renamingId && (
        <div className="modal-overlay" onClick={() => setRenamingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">重命名主题</div>
            <div className="modal-body">
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setRenamingId(null)}>取消</button>
              <button className="confirm" onClick={handleRenameSubmit}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
