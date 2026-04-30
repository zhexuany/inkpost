import { EditorView } from '@codemirror/view';
import { getLang } from '../shared/i18n';

const ZH: Record<string, string> = {
  Find: '查找',
  Replace: '替换',
  'replace all': '全部替换',
  'next match': '下一个',
  'previous match': '上一个',
  selectAll: '全选',
  All: '全选',
  'Match case': '区分大小写',
  'Match whole word': '全词匹配',
  'Use regular expression': '正则',
  close: '关闭',
  'By word': '全词',
  Aa: 'Aa',
};

function translate(el: HTMLElement) {
  if (getLang() !== 'zh') return;

  // Translate inputs (placeholder)
  for (const input of el.querySelectorAll<HTMLInputElement>('.cm-textfield')) {
    const key = input.placeholder;
    if (key && ZH[key]) input.placeholder = ZH[key];
  }

  // Translate buttons (text content and title)
  for (const btn of el.querySelectorAll<HTMLButtonElement>('.cm-button')) {
    const key = btn.textContent?.trim() ?? '';
    if (key && ZH[key]) {
      btn.textContent = ZH[key];
    }
    const title = btn.title || btn.getAttribute('aria-label');
    if (title && ZH[title]) {
      btn.title = ZH[title];
      btn.setAttribute('aria-label', ZH[title]);
    }
  }

  // Translate checkbox labels
  for (const label of el.querySelectorAll<HTMLLabelElement>('label')) {
    const text = label.textContent?.trim() ?? '';
    if (text && ZH[text]) {
      // Preserve the checkbox input, replace text
      const input = label.querySelector('input');
      if (input) {
        // Clear text nodes and set translated text
        for (const child of Array.from(label.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            child.textContent = child.textContent?.replace(text, ZH[text]) ?? '';
          }
        }
      } else {
        label.textContent = ZH[text];
      }
    }
  }
}

/** Attach a MutationObserver that translates the search panel when it appears. */
export function localizeSearchPanel(view: EditorView): () => void {
  if (getLang() !== 'zh') return () => {};

  const observer = new MutationObserver(() => {
    const panel = view.dom.querySelector<HTMLElement>('.cm-panel.cm-search');
    if (panel) translate(panel);
  });

  observer.observe(view.dom, { childList: true, subtree: true });

  return () => observer.disconnect();
}
