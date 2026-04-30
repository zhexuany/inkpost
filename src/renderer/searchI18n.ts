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

function translate(el: HTMLElement) {
  if (getLang() !== 'zh') return;

  // Inputs: translate placeholder
  for (const input of el.querySelectorAll<HTMLInputElement>('.cm-textfield')) {
    const zh = ZH_INPUT[input.placeholder];
    if (zh) input.placeholder = zh;
  }

  // Buttons: identify by name, translate title/aria-label
  for (const btn of el.querySelectorAll<HTMLButtonElement>('.cm-button')) {
    const name = btn.getAttribute('name') ?? '';
    const zh = ZH_BUTTON[name];
    if (!zh) continue;
    btn.title = zh;
    btn.setAttribute('aria-label', zh);
    // Only replace visible text if the button shows text (not just an SVG icon)
    if (!btn.querySelector('svg')) btn.textContent = zh;
  }

  // Checkboxes: find by name, replace the label's text node
  for (const name of Object.keys(ZH_CHECKBOX)) {
    const cb = el.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!cb?.parentElement) continue;
    // Clear text content after the <input>, then append translated text
    let found = false;
    for (const child of Array.from(cb.parentElement.childNodes)) {
      if (child === cb) { found = true; continue; }
      if (found && child.nodeType === Node.TEXT_NODE) {
        child.textContent = ZH_CHECKBOX[name];
        found = false;
      } else if (found && child instanceof HTMLElement && child.tagName !== 'INPUT') {
        child.textContent = ZH_CHECKBOX[name];
        found = false;
      }
    }
    // Also handle: no text node, text is in the label's own textContent
    if (found && cb.parentElement instanceof HTMLLabelElement) {
      const label = cb.parentElement;
      let tail = '';
      for (const child of Array.from(label.childNodes)) {
        if (child === cb) { found = true; continue; }
        if (found) tail += child.textContent ?? '';
      }
      const trimmed = tail.trim();
      if (trimmed && trimmed !== ZH_CHECKBOX[name]) {
        label.childNodes.forEach(c => {
          if (c.nodeType === Node.TEXT_NODE) c.textContent = ZH_CHECKBOX[name];
        });
        if (!label.textContent?.trim()) label.appendChild(document.createTextNode(ZH_CHECKBOX[name]));
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
      requestAnimationFrame(() => translate(panel));
    }
  });

  observer.observe(view.dom, { childList: true, subtree: true });

  return () => observer.disconnect();
}
