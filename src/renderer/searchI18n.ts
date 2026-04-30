import { EditorView } from '@codemirror/view';
import { getLang } from '../shared/i18n';

const ZH_BUTTON: Record<string, string> = {
  next: '下一个',
  prev: '上一个',
  selectAll: '全选',
  replace: '替换',
  replaceAll: '全部替换',
  close: '关闭',
};

const ZH_INPUT: Record<string, string> = {
  Find: '查找',
  Replace: '替换',
};

const ZH_CHECKBOX: Record<string, string> = {
  caseSensitive: '区分大小写',
  wholeWord: '全词匹配',
  regexp: '正则',
};

function translate(panel: HTMLElement) {
  if (getLang() !== 'zh') return;

  // Input placeholders
  for (const input of panel.querySelectorAll<HTMLInputElement>('.cm-textfield')) {
    const zh = ZH_INPUT[input.placeholder];
    if (zh) input.placeholder = zh;
  }

  // Buttons by name attribute
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('.cm-button')) {
    const name = btn.getAttribute('name') ?? '';
    const zh = ZH_BUTTON[name];
    if (!zh) continue;
    btn.title = zh;
    btn.setAttribute('aria-label', zh);
    if (!btn.querySelector('svg')) btn.textContent = zh;
  }

  // Checkbox labels by input name
  for (const [name, zh] of Object.entries(ZH_CHECKBOX)) {
    const cb = panel.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!cb) continue;
    const label = cb.closest<HTMLLabelElement>('label');
    if (!label) continue;
    // Remove all text content after the input, insert translated text
    let after = false;
    const toRemove: ChildNode[] = [];
    for (const child of label.childNodes) {
      if (!after && child === cb) { after = true; continue; }
      if (after && child.nodeType === Node.TEXT_NODE) {
        child.textContent = zh;
        after = false; // only replace first text node
      } else if (after && child instanceof HTMLElement) {
        child.textContent = zh;
        after = false;
      }
    }
    // Fallback: if no text node found after the input, append one
    if (after) {
      label.appendChild(document.createTextNode(zh));
    }
  }
}

/** Start observing the document for search panels (from any editor). */
let observer: MutationObserver | null = null;
let observerCount = 0;

export function localizeSearchPanel(_view: EditorView): () => void {
  if (getLang() !== 'zh') return () => {};

  observerCount++;

  if (!observer) {
    observer = new MutationObserver(() => {
      for (const panel of document.querySelectorAll<HTMLElement>('.cm-panel.cm-search')) {
        translate(panel);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    observerCount--;
    if (observerCount <= 0) {
      observer?.disconnect();
      observer = null;
      observerCount = 0;
    }
  };
}
