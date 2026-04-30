export interface ScrollMapItem {
  /** 1-based source line number where this block starts */
  sourceStartLine: number;
  /** 1-based source line number where this block ends */
  sourceEndLine: number;
  /** Character offset in source where this block starts */
  sourceStartOffset?: number;
  /** Character offset in source where this block ends */
  sourceEndOffset?: number;
  /** Pixel offset from top of scroll container to top of this element */
  previewTop: number;
  /** Pixel offset from top of scroll container to bottom of this element */
  previewBottom: number;
  /** Element height in pixels */
  previewHeight: number;
  /** The DOM element */
  element: HTMLElement;
}

export type ScrollMap = ScrollMapItem[];

export interface EditorAPI {
  getTopVisibleLine(): number;     // 0-based line number
  scrollToLine(line: number): void; // 0-based line number
  getScrollElement(): HTMLElement | null;
}

export interface PreviewAPI {
  getScrollElement(): HTMLElement | null;
  getScrollMap(): ScrollMap;
}
