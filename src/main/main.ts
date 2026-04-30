import { app, BrowserWindow, ipcMain, clipboard, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import Store from 'electron-store';
import { renderMarkdown } from './renderer';
import type { StoreSchema, ImageProcessingOptions } from '../shared/types';
import { DEFAULT_IMAGE_OPTIONS } from '../shared/types';
import { defaultTheme } from '../shared/default-theme';
import { presetThemes } from '../shared/presets';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

const store = new Store<StoreSchema>({
  defaults: {
    themes: [defaultTheme],
    activeThemeId: defaultTheme.id,
    recentFiles: [],
    imageOptions: DEFAULT_IMAGE_OPTIONS,
    autoSave: true,
    windowBounds: { x: 100, y: 100, width: 1200, height: 800 },
    draft: null,
    contentHistory: [],
  },
});

async function createWindow() {
  const bounds = store.get('windowBounds');
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    title: '墨帖 InkPost',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      const { x, y, width, height } = mainWindow.getBounds();
      store.set('windowBounds', { x, y, width, height });
    }
  });
}

const menuTemplate: Electron.MenuItemConstructorOptions[] = [
  {
    label: '文件',
    submenu: [
      {
        label: '打开...',
        accelerator: 'CmdOrCtrl+O',
        click: () => handleOpenFile(),
      },
      { type: 'separator' },
      { role: 'quit', label: '退出' },
    ],
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      { role: 'selectAll', label: '全选' },
    ],
  },
];

async function handleOpenFile(): Promise<string | null> {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  mainWindow.webContents.send('file:opened', { path: filePath, content });
  return filePath;
}

app.setName('墨帖 InkPost');

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC: Rendering ---

ipcMain.handle('render:markdown', async (_event, args: {
  markdown: string;
  css: string;
  filePath?: string;
  imageOptions?: ImageProcessingOptions;
}) => {
  return renderMarkdown(args.markdown, args.css, args.filePath, args.imageOptions);
});

ipcMain.handle('clipboard:writeHTML', async (_event, html: string) => {
  clipboard.writeHTML(html);
  return true;
});

// --- IPC: Content history ---

ipcMain.handle('history:getList', () => {
  return store.get('contentHistory', []);
});

ipcMain.handle('history:getEntry', (_event, id: string) => {
  const history = store.get('contentHistory', []);
  return history.find((h: any) => h.id === id) ?? null;
});

ipcMain.handle('history:saveSnapshot', (_event, data: { content: string; filePath: string | null }) => {
  const history = store.get('contentHistory', []);
  history.unshift({
    id: Date.now().toString(),
    content: data.content,
    filePath: data.filePath,
    timestamp: Date.now(),
  });
  store.set('contentHistory', history.slice(0, 20));
});

// --- IPC: File operations ---

ipcMain.handle('file:open', async () => {
  return handleOpenFile();
});

ipcMain.handle('file:save', async (_event, args: { filePath: string; content: string }) => {
  fs.writeFileSync(args.filePath, args.content, 'utf-8');
  return true;
});

ipcMain.handle('file:saveAs', async (_event, content: string) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('file:read', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
});

// --- IPC: Store — themes ---

ipcMain.handle('store:getThemes', () => {
  const customThemes = store.get('themes', []);
  return [...presetThemes, ...customThemes.filter(t => !presetThemes.some(p => p.id === t.id))];
});

ipcMain.handle('store:getActiveThemeId', () => {
  return store.get('activeThemeId', defaultTheme.id);
});

ipcMain.handle('store:setActiveThemeId', (_event, id: string) => {
  store.set('activeThemeId', id);
});

ipcMain.handle('store:saveTheme', (_event, theme: import('../shared/types').InkPostTheme) => {
  const themes = store.get('themes', []);
  const idx = themes.findIndex(t => t.id === theme.id);
  if (idx >= 0) {
    themes[idx] = theme;
  } else {
    themes.push(theme);
  }
  store.set('themes', themes);
});

ipcMain.handle('store:deleteTheme', (_event, id: string) => {
  const themes = store.get('themes', []).filter(t => t.id !== id);
  store.set('themes', themes);
  if (store.get('activeThemeId') === id) {
    store.set('activeThemeId', defaultTheme.id);
  }
});

// --- IPC: Store — files ---

ipcMain.handle('store:getRecentFiles', () => {
  return store.get('recentFiles', []);
});

ipcMain.handle('store:addRecentFile', (_event, filePath: string) => {
  const files = store.get('recentFiles', []).filter(f => f !== filePath);
  files.unshift(filePath);
  store.set('recentFiles', files.slice(0, 10));
});

ipcMain.handle('store:getAutoSave', () => {
  return store.get('autoSave', true);
});

// --- IPC: Draft (auto-save & crash recovery) ---

ipcMain.handle('draft:save', (_event, data: { content: string; filePath: string | null }) => {
  store.set('draft', { ...data, timestamp: Date.now() });
});

ipcMain.handle('draft:load', () => {
  return store.get('draft', null);
});

ipcMain.handle('draft:clear', () => {
  store.set('draft', null);
});
