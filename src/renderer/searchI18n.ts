import { EditorView } from '@codemirror/view';
import { getLang } from '../shared/i18n';

// Map button name / placeholder / label text → Chinese
const ZH: Record<string, string> = {
  // Inputs
  Find: '查找',
  Replace: '替换',
  // Buttons (by name attribute)
  next: '下一个',
  prev: '上一个',
  selectAll: '全选',
  replace: '替换',
  replaceAll: '全部替换',
  close: '关闭',
  // Checkbox label text
  Aa: 'Aa',
  'Match case': '区分大小写',
  'By word': '全词',
  '.*': '.*',
  // Newer CM6 versions use these
  'Whole word': '全词',
  Regexp: '正则',
  'Use regular expression': '正则',
};

function translate(el: HTMLElement) {
  if (getLang() !== 'zh') return;

  // Input placeholders
  for (const input of el.querySelectorAll<HTMLInputElement>('.cm-textfield')) {
    const key = input.placeholder;
    if (key && ZH[key]) input.placeholder = ZH[key];
    // Some CM6 versions use title on the input wrapper
    if (input.title && ZH[input.title]) input.title = ZH[input.title];
  }

  // Buttons: identify by name attribute, translate title/aria-label
  for (const btn of el.querySelectorAll<HTMLButtonElement>('.cm-button')) {
    const name = btn.getAttribute('name') ?? '';
    const label = ZH[name];
    if (label) {
      if (btn.title) btn.title = label;
      btn.setAttribute('aria-label', label);
      // Only replace text content if it's a text button (not SVG icon)
      const hasSvg = btn.querySelector('svg');
      if (!hasSvg) btn.textContent = label;
    }
  }

  // Checkbox labels: translate adjacent text nodes
  for (const label of el.querySelectorAll<HTMLLabelElement>('label')) {
    // Collect the full text content (excluding nested input elements)
    let text = '';
    for (const child of label.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) text += child.textContent ?? '';
      else if (child instanceof HTMLElement && child.tagName !== 'INPUT') {
        text += child.textContent ?? '';
      }
    }
    text = text.trim();
    if (!text || !ZH[text]) continue;

    // Replace text in all non-input child nodes
    for (const child of label.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        child.textContent = child.textContent.replace(child.textContent.trim(), ZH[text]);
      } else if (child instanceof HTMLElement && child.tagName !== 'INPUT') {
        const childText = child.textContent?.trim();
        if (childText && ZH[childText]) {
          child.textContent = ZH[childText];
        }
      }
    }
  }
}

/** Attach a MutationObserver that translates the search panel when it appears. */
export function localizeSearchPanel(view: EditorView): () => void {
  if (getLang() !== 'zh') return () => {};

  const observer = new MutationObserver(() => {
    const panel = view.dom.querySelector<HTMLElement>('.cm-panel.cm-search');
    if (panel) {
      // Defer so CodeMirror finishes building the full panel DOM first
      requestAnimationFrame(() => translate(panel));
    }
  });

  observer.observe(view.dom, { childList: true, subtree: true });

  return () => observer.disconnect();
}
