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

  // Store — files
  getRecentFiles: (): Promise<string[]> => ipcRenderer.invoke('store:getRecentFiles'),
  addRecentFile: (filePath: string): Promise<void> => ipcRenderer.invoke('store:addRecentFile', filePath),
};

contextBridge.exposeInMainWorld('inkpost', api);
