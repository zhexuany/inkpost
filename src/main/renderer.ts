import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import texmath from 'markdown-it-texmath';
import juice from 'juice';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import type { ImageProcessingOptions, RenderResult } from '../shared/types';
import { DEFAULT_IMAGE_OPTIONS } from '../shared/types';

const katex = require('katex');
const katexCss = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf-8');
const texmathPlugin = texmath.use(katex);
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(footnote).use(texmathPlugin);

// Normalize LaTeX delimiters: \[...\] → $$...$$, \(...\) → $...$
function normalizeLatexDelimiters(md: string): string {
  // \[...\] → $$...$$ (display math)
  md = md.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `$$${formula}$$`);
  // \(...\) → $...$ (inline math)
  md = md.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula}$`);
  return md;
}

// Post-process markdown-it output to add mdnice-compatible HTML structure
function postProcessHtml(html: string): string {
  // 1. Wrap headings with mdnice-style .prefix/.content/.suffix spans
  html = html.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/g, (_, level, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    return `<h${level}${attrs}><span class="prefix"></span><span class="content">${text}</span><span class="suffix"></span></h${level}>`;
  });

  // 2. Add multiquote-N classes to nested blockquotes
  html = addMultiquoteClasses(html);

  // 3. Wrap <li> content in <section> for mdnice list styling
  html = html.replace(/<li>([\s\S]*?)<\/li>/g, (match, content: string) => {
    // Skip if already has section
    if (content.includes('<section')) return match;
    return `<li><section>${content}</section></li>`;
  });

  return html;
}

function addMultiquoteClasses(html: string): string {
  // Track blockquote nesting depth and add multiquote-N classes
  let depth = 0;
  let result = '';
  let i = 0;

  while (i < html.length) {
    if (html.substring(i, i + 13) === '<blockquote>') {
      depth++;
      result += `<blockquote class="multiquote-${depth}">`;
      i += 13;
    } else if (html.substring(i, i + 14) === '</blockquote>') {
      result += '</blockquote>';
      if (depth > 0) depth--;
      i += 14;
    } else {
      result += html[i];
      i++;
    }
  }

  return result;
}

const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function isLocalPath(src: string): boolean {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return false;
  }
  return true;
}

async function processImage(
  imgPath: string,
  mdDir: string,
  options: ImageProcessingOptions,
): Promise<string> {
  const fullPath = path.resolve(mdDir, imgPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image not found: ${fullPath}`);
  }

  let pipeline = sharp(fullPath);
  const metadata = await pipeline.metadata();

  if (metadata.width && metadata.width > options.maxWidth) {
    pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true });
  }

  const buf = await pipeline
    .jpeg({ quality: options.quality })
    .toBuffer();

  const mimeType = 'image/jpeg';
  return `data:${mimeType};base64,${buf.toString('base64')}`;
}

export async function renderMarkdown(
  markdown: string,
  css: string,
  mdFilePath?: string,
  imageOptions: ImageProcessingOptions = DEFAULT_IMAGE_OPTIONS,
): Promise<RenderResult> {
  const warnings: string[] = [];
  const mdDir = mdFilePath ? path.dirname(mdFilePath) : process.cwd();

  // Process local images to base64
  const imageMatches = [...markdown.matchAll(IMAGE_RE)];
  let processedMd = normalizeLatexDelimiters(markdown);

  for (const match of imageMatches) {
    const [fullMatch, alt, src] = match;
    if (isLocalPath(src)) {
      try {
        const base64 = await processImage(src, mdDir, imageOptions);
        processedMd = processedMd.replace(fullMatch, `![${alt}](${base64})`);
      } catch (err: any) {
        warnings.push(`Image processing failed: ${src} — ${err.message}`);
      }
    }
  }

  // Render markdown to HTML
  let htmlBody = md.render(processedMd);

  // Add mdnice-compatible structure
  htmlBody = postProcessHtml(htmlBody);

  // Wrap in #nice container for mdnice CSS compatibility
  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body><section id="nice">${htmlBody}</section></body>
</html>`;

  // Combine user CSS + KaTeX CSS for inlining
  const combinedCss = katexCss + '\n' + css;

  const inlinedHtml = juice.inlineContent(fullHtml, combinedCss, {
    inlinePseudoElements: false,
    preserveImportant: true,
  });

  // Extract just the #nice content for clipboard
  const niceMatch = inlinedHtml.match(/<section[^>]*id="nice"[^>]*>([\s\S]*)<\/section>/i);
  const clipboardHtml = niceMatch
    ? `<section id="nice">${niceMatch[1].trim()}</section>`
    : inlinedHtml;

  // Stats
  const textContent = markdown.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/[#*`>\[\]()_-]/g, '');
  const wordCount = textContent.replace(/\s+/g, '').length;
  const imageCount = imageMatches.length;
  const totalSizeKB = Buffer.byteLength(clipboardHtml, 'utf8') / 1024;

  if (totalSizeKB > 5120) {
    warnings.push(`Clipboard content exceeds 5MB (${Math.round(totalSizeKB)}KB), paste may fail`);
  }

  return {
    html: clipboardHtml,
    imageCount,
    wordCount,
    warnings,
    totalSizeKB: Math.round(totalSizeKB),
  };
}
