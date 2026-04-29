import type { ImageProcessingOptions, RenderResult, InkPostTheme } from '../shared/types';

export interface InkPostAPI {
  // Rendering
  renderMarkdown: (args: {
    markdown: string;
    css: string;
    filePath?: string;
    imageOptions?: ImageProcessingOptions;
  }) => Promise<RenderResult>;

  // Clipboard
  copyToClipboard: (html: string) => Promise<boolean>;

  // File operations
  openFile: () => Promise<string | null>;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  saveFileAs: (content: string) => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;

  // Events
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => void;

  // Store — themes
  getThemes: () => Promise<InkPostTheme[]>;
  getActiveThemeId: () => Promise<string>;
  setActiveThemeId: (id: string) => Promise<void>;
  saveTheme: (theme: InkPostTheme) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;

  // Store — files
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<void>;

  // Draft
  saveDraft: (data: { content: string; filePath: string | null }) => Promise<void>;
  loadDraft: () => Promise<{ content: string; filePath: string | null; timestamp: number } | null>;
  clearDraft: () => Promise<void>;
}

declare global {
  interface Window {
    inkpost: InkPostAPI;
  }
}
