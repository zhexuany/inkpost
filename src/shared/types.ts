export interface InkPostTheme {
  id: string;
  name: string;
  css: string;
  isBuiltIn: boolean;
}

export interface ImageProcessingOptions {
  maxWidth: number;
  quality: number;
  maxSizeKB: number;
}

export interface RenderResult {
  html: string;
  imageCount: number;
  wordCount: number;
  warnings: string[];
  totalSizeKB: number;
}

export interface StoreSchema {
  themes: InkPostTheme[];
  activeThemeId: string;
  recentFiles: string[];
  imageOptions: ImageProcessingOptions;
  autoSave: boolean;
  windowBounds: { x: number; y: number; width: number; height: number };
}

export const DEFAULT_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 800,
  quality: 85,
  maxSizeKB: 500,
};
