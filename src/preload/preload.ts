import { contextBridge, ipcRenderer } from 'electron';
import type { InkPostTheme } from '../shared/types';

const api = {
  // Rendering
  renderMarkdown: (args: {
    markdown: string;
    css: string;
    filePath?: string;
    imageOptions?: import('../shared/types').ImageProcessingOptions;
  }) => ipcRenderer.invoke('render:markdown', args),

  // Clipboard
  copyToClipboard: (html: string) => ipcRenderer.invoke('clipboard:writeHTML', html),

  // Content history
  getContentHistory: () => ipcRenderer.invoke('history:getList'),
  getContentHistoryEntry: (id: string) => ipcRenderer.invoke('history:getEntry', id),
  saveContentSnapshot: (data: { content: string; filePath: string | null }) =>
    ipcRenderer.invoke('history:saveSnapshot', data),

  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),

  // Events
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => {
    ipcRenderer.on('file:opened', (_event, data) => callback(data));
  },

  // Store — themes
  getThemes: (): Promise<InkPostTheme[]> => ipcRenderer.invoke('store:getThemes'),
  getActiveThemeId: (): Promise<string> => ipcRenderer.invoke('store:getActiveThemeId'),
  setActiveThemeId: (id: string): Promise<void> => ipcRenderer.invoke('store:setActiveThemeId', id),
  saveTheme: (theme: InkPostTheme): Promise<void> => ipcRenderer.invoke('store:saveTheme', theme),
  deleteTheme: (id: string): Promise<void> => ipcRenderer.invoke('store:deleteTheme', id),

  // Theme management
  createTheme: (name: string): Promise<InkPostTheme> => ipcRenderer.invoke('theme:create', name),
  renameTheme: (id: string, name: string): Promise<void> => ipcRenderer.invoke('theme:rename', { id, name }),
  resetPresetTheme: (id: string): Promise<void> => ipcRenderer.invoke('theme:resetPreset', id),
  importCss: (): Promise<{ name: string; css: string } | null> => ipcRenderer.invoke('theme:importCss'),
  exportCss: (name: string, css: string): Promise<boolean> => ipcRenderer.invoke('theme:exportCss', { name, css }),

  // Store — files
  getRecentFiles: (): Promise<string[]> => ipcRenderer.invoke('store:getRecentFiles'),
  addRecentFile: (filePath: string): Promise<void> => ipcRenderer.invoke('store:addRecentFile', filePath),

  // Draft
  saveDraft: (data: { content: string; filePath: string | null }): Promise<void> =>
    ipcRenderer.invoke('draft:save', data),
  loadDraft: (): Promise<{ content: string; filePath: string | null; timestamp: number } | null> =>
    ipcRenderer.invoke('draft:load'),
  clearDraft: (): Promise<void> => ipcRenderer.invoke('draft:clear'),
};

contextBridge.exposeInMainWorld('inkpost', api);
