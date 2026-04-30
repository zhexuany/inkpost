/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { buildScrollMap } from '../buildScrollMap';

describe('buildScrollMap', () => {
  function createContainer(): HTMLElement {
    const div = document.createElement('div');
    div.style.position = 'relative';
    return div;
  }

  it('returns empty array for empty container', () => {
    const container = createContainer();
    expect(buildScrollMap(container)).toEqual([]);
  });

  it('returns empty array when no data-source-start elements exist', () => {
    const container = createContainer();
    container.innerHTML = '<p>Hello</p><div>World</div>';
    expect(buildScrollMap(container)).toEqual([]);
  });

  it('builds map from elements with data-source-start', () => {
    const container = createContainer();
    container.innerHTML = `
      <h1 data-source-start="1" data-source-end="1" style="height:40px">Title</h1>
      <p data-source-start="3" data-source-end="5" style="height:60px">Para</p>
    `;
    const map = buildScrollMap(container);
    expect(map).toHaveLength(2);
    expect(map[0].sourceStartLine).toBe(1);
    expect(map[0].sourceEndLine).toBe(1);
    expect(map[1].sourceStartLine).toBe(3);
    expect(map[1].sourceEndLine).toBe(5);
  });

  it('sorts by sourceStartLine', () => {
    const container = createContainer();
    // Intentionally out of order in DOM
    container.innerHTML = `
      <p data-source-start="10" data-source-end="12" style="height:20px">Second</p>
      <h1 data-source-start="1" data-source-end="1" style="height:40px">First</h1>
    `;
    const map = buildScrollMap(container);
    expect(map).toHaveLength(2);
    expect(map[0].sourceStartLine).toBe(1);
    expect(map[1].sourceStartLine).toBe(10);
  });

  it('skips elements with invalid data-source-start', () => {
    const container = createContainer();
    container.innerHTML = `
      <p data-source-start="abc" data-source-end="1">Bad</p>
      <p data-source-start="1" data-source-end="xyz">Also Bad</p>
      <h1 data-source-start="5" data-source-end="5">Good</h1>
    `;
    const map = buildScrollMap(container);
    expect(map).toHaveLength(1);
    expect(map[0].sourceStartLine).toBe(5);
  });

  it('sets previewTop, previewBottom, and previewHeight', () => {
    const container = createContainer();
    const el = document.createElement('div');
    el.setAttribute('data-source-start', '1');
    el.setAttribute('data-source-end', '1');
    Object.defineProperty(el, 'offsetHeight', { value: 100 });
    Object.defineProperty(el, 'offsetTop', { value: 50 });
    container.appendChild(el);

    // Make offsetParent return container
    Object.defineProperty(el, 'offsetParent', { value: container });

    const map = buildScrollMap(container);
    expect(map).toHaveLength(1);
    expect(map[0].previewHeight).toBe(100);
    expect(map[0].previewBottom).toBe(150); // 50 + 100
  });

  it('handles empty document', () => {
    const container = createContainer();
    const map = buildScrollMap(container);
    expect(map).toEqual([]);
  });
});
