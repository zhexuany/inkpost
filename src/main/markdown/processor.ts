import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import remarkSourcePosition from './plugins/remarkSourcePosition';
import rehypeSourcePosition from './plugins/rehypeSourcePosition';
import remarkContainers from './plugins/remarkContainers';
import remarkMathToSvg, { type MathRenderer } from './plugins/remarkMathToSvg';

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
  // rehype-raw converts kebab-case attrs to camelCase, so list both forms
  attributes: {
    '*': ['data-source-start', 'dataSourceStart', 'data-source-end', 'dataSourceEnd', 'data-source-start-offset', 'dataSourceStartOffset', 'data-source-end-offset', 'dataSourceEndOffset', 'data-formula', 'dataFormula', 'style', 'className', 'class'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    pre: ['data-source-start', 'dataSourceStart', 'data-source-end', 'dataSourceEnd'],
    section: ['class', 'className', 'data-source-start', 'dataSourceStart', 'data-source-end', 'dataSourceEnd', 'data-formula', 'dataFormula', 'style', 'id'],
    span: ['class', 'className', 'data-source-start', 'dataSourceStart', 'data-source-end', 'dataSourceEnd', 'data-formula', 'dataFormula', 'style'],
    svg: ['xmlns', 'xmlns:xlink', 'xmlnsXlink', 'viewBox', 'width', 'height', 'style', 'class', 'role', 'focusable', 'overflow', 'aria-label', 'ariaLabel'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'stroke-linecap', 'strokeLinecap', 'stroke-linejoin', 'strokeLinejoin', 'transform'],
    g: ['fill', 'stroke', 'stroke-width', 'strokeWidth', 'transform'],
    use: ['href', 'xlink:href', 'xlinkHref', 'transform'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'strokeWidth', 'transform'],
    rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'transform'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'transform'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'transform'],
    polygon: ['points', 'fill', 'stroke', 'transform'],
    polyline: ['points', 'fill', 'stroke', 'transform'],
    text: ['x', 'y', 'font-size', 'fontSize', 'font-family', 'fontFamily', 'fill', 'text-anchor', 'textAnchor', 'dominant-baseline', 'dominantBaseline', 'transform'],
    tspan: ['x', 'y', 'font-size', 'fontSize', 'font-family', 'fontFamily', 'fill', 'transform'],
  },
};

/**
 * Normalize container syntax for remark-directive:
 * "::: block-1" -> ":::block-1" (removes space after opening :::, closing ::: unchanged)
 */
export function normalizeContainerSyntax(md: string): string {
  // Remove space after opening :::name, but skip closing ::: (no name)
  // [^\s:] excludes colons so ":::\n\n:::block" won't match across containers
  return md.replace(/^:::\s+([^\s:]+)/gm, ':::$1');
}

export function createProcessor(mathRenderer?: MathRenderer) {
  const p = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkMath)
    .use(remarkContainers);

  if (mathRenderer) {
    p.use(remarkMathToSvg, mathRenderer);
  }

  return p
    .use(remarkSourcePosition)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSourcePosition)
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify);
}

export async function processMarkdown(md: string): Promise<string> {
  const normalized = normalizeContainerSyntax(md);
  const result = await createProcessor().process(normalized);
  return String(result);
}

export async function processMarkdownWithMath(md: string, mathRenderer: MathRenderer): Promise<string> {
  const normalized = normalizeContainerSyntax(md);
  const result = await createProcessor(mathRenderer).process(normalized);
  return String(result);
}
