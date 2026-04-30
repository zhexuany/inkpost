import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkSourcePosition from '../plugins/remarkSourcePosition';

describe('remarkSourcePosition', () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkSourcePosition)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify);

  it('adds data-source-start/end to headings', async () => {
    const result = await processor.process('# Hello');
    const html = String(result);
    expect(html).toContain('data-source-start="1"');
    expect(html).toContain('data-source-end="1"');
  });

  it('adds data-source-start/end to paragraphs', async () => {
    const result = await processor.process('Hello world.\n\nThis is a paragraph.');
    const html = String(result);
    expect(html).toContain('data-source-start="1"');
    expect(html).toContain('data-source-end="1"');
    expect(html).toContain('data-source-start="3"');
    expect(html).toContain('data-source-end="3"');
  });

  it('adds data-source-start/end to code blocks', async () => {
    const result = await processor.process('```js\nconsole.log(1)\n```');
    const html = String(result);
    // The pre element should have source attrs
    expect(html).toContain('data-source-start="1"');
    expect(html).toContain('data-source-end="3"');
  });

  it('adds data-source-start/end to blockquotes', async () => {
    const result = await processor.process('> quoted text');
    const html = String(result);
    expect(html).toContain('data-source-start="1"');
  });

  it('adds data-source-start/end to lists', async () => {
    const result = await processor.process('- item 1\n- item 2');
    const html = String(result);
    expect(html).toContain('data-source-start="1"');
    expect(html).toContain('data-source-end="2"');
  });

  it('does not add data-source attrs to inline elements', async () => {
    const result = await processor.process('Hello **bold** and *italic*');
    const html = String(result);
    // <strong> and <em> should NOT have data-source attrs
    expect(html).not.toMatch(/<strong[^>]*data-source/);
    expect(html).not.toMatch(/<em[^>]*data-source/);
  });

  it('handles document without any blocks gracefully', async () => {
    const result = await processor.process('');
    const html = String(result);
    // Should produce valid HTML without errors
    expect(typeof html).toBe('string');
  });

  it('includes data-source-start-offset and data-source-end-offset', async () => {
    const result = await processor.process('# Title');
    const html = String(result);
    expect(html).toContain('data-source-start-offset');
    expect(html).toContain('data-source-end-offset');
  });
});
