import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import remarkSourcePosition from './plugins/remarkSourcePosition';
import remarkContainers from './plugins/remarkContainers';

const sanitizeSchema = {
  strip: ['script', 'iframe', 'object', 'embed'],
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https', 'data'],
  },
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
    'a', 'img',
    'pre', 'code',
    'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'section', 'span', 'div',
    'figure', 'figcaption',
    'sub', 'sup',
    'svg', 'path', 'g', 'defs', 'use', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan',
  ],
  attributes: {
    '*': ['data-source-start', 'data-source-end', 'data-source-start-offset', 'data-source-end-offset', 'data-formula', 'style', 'className', 'class'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    pre: ['data-source-start', 'data-source-end'],
    section: ['class', 'className', 'data-source-start', 'data-source-end', 'data-formula', 'style', 'id'],
    span: ['class', 'className', 'data-source-start', 'data-source-end', 'data-formula', 'style'],
    svg: ['xmlns', 'viewBox', 'width', 'height', 'style', 'class'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    g: ['fill', 'stroke', 'stroke-width', 'transform'],
    use: ['href', 'xlink:href'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
    rect: ['x', 'y', 'width', 'height', 'fill', 'stroke'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke'],
    polygon: ['points', 'fill', 'stroke'],
    polyline: ['points', 'fill', 'stroke'],
    text: ['x', 'y', 'font-size', 'font-family', 'fill', 'text-anchor', 'dominant-baseline'],
    tspan: ['x', 'y', 'font-size', 'font-family', 'fill'],
  },
};

/**
 * Normalize container syntax for remark-directive:
 * "::: block-1" -> ":::block-1" (removes space after opening :::, closing ::: unchanged)
 */
export function normalizeContainerSyntax(md: string): string {
  return md.replace(/^:::\s+(\S+)/gm, ':::$1');
}

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkSourcePosition)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify);
}

let _processor: ReturnType<typeof createProcessor> | null = null;

function getProcessor() {
  if (!_processor) _processor = createProcessor();
  return _processor;
}

export async function processMarkdown(md: string): Promise<string> {
  const normalized = normalizeContainerSyntax(md);
  const result = await getProcessor().process(normalized);
  return String(result);
}
