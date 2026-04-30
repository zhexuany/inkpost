import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import juice from 'juice';
import type { ImageProcessingOptions, RenderResult } from '../shared/types';
import { DEFAULT_IMAGE_OPTIONS } from '../shared/types';
import { processMarkdown } from './markdown/processor';

const mathjaxNode = require('mathjax-node');

// Configure mathjax-node
mathjaxNode.config({
  MathJax: {
    tex2jax: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
  },
});

// Normalize LaTeX delimiters: \[...\] -> $$...$$, \(...\) -> $...$
function normalizeLatexDelimiters(md: string): string {
  md = md.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `$$${formula}$$`);
  md = md.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula}$`);
  return md;
}

// Render a single formula as SVG using mathjax-node
function renderFormulaSvg(latex: string, display: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    mathjaxNode.typeset({
      math: latex,
      format: 'TeX',
      svg: true,
      useFontCache: false,
      linebreaks: !display,
      display,
      speakText: false,
    }, (data: any) => {
      if (data.errors) {
        reject(new Error(data.errors.join(', ')));
      } else {
        resolve(data.svg);
      }
    });
  });
}

// Pre-process markdown to render math delimiters to SVG
// This runs BEFORE unified so that math is already SVG HTML in the source
async function renderMathInMarkdown(md: string, warnings: string[]): Promise<string> {
  // Compute line number from character index (for data-source-* attrs)
  const lineStarts: number[] = [0];
  for (let i = 0; i < md.length; i++) {
    if (md[i] === '\n') lineStarts.push(i + 1);
  }
  function getLineNumber(charIdx: number): number {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (lineStarts[mid] <= charIdx) lo = mid + 1;
      else hi = mid - 1;
    }
    return hi + 1; // 1-based
  }

  const replacements: { start: number; end: number; html: string }[] = [];

  // Step 1: Block math $$...$$ (can span multiple lines)
  const blockRe = /\$\$([\s\S]*?)\$\$/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(md)) !== null) {
    const latex = match[1].trim();
    if (!latex) continue;
    try {
      const svg = await renderFormulaSvg(latex, true);
      const escapedLatex = latex.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
      const startLine = getLineNumber(match.index);
      const endLine = getLineNumber(match.index + match[0].length - 1);
      const html = `<span class="span-block-equation" style="cursor:pointer" data-source-start="${startLine}" data-source-end="${endLine}"><section class="block-equation" data-formula="${escapedLatex}" style="text-align:center;overflow-x:auto;overflow-y:auto;display:block;">${svg}</section></span>`;
      replacements.push({ start: match.index, end: match.index + match[0].length, html });
    } catch (err: any) {
      warnings.push(`Formula SVG failed: ${err.message}`);
    }
  }

  // Step 2: Inline math $...$ (single line, non-empty)
  const inlineRe = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;
  while ((match = inlineRe.exec(md)) !== null) {
    // Skip if inside a block math replacement
    if (replacements.some(r => match!.index >= r.start && match!.index < r.end)) continue;

    const latex = match[1].trim();
    if (!latex) continue;
    try {
      const svg = await renderFormulaSvg(latex, false);
      const escapedLatex = latex.replace(/"/g, '&quot;');
      const startLine = getLineNumber(match.index);
      const endLine = getLineNumber(match.index + match[0].length - 1);
      const html = `<span class="span-inline-equation" style="cursor:pointer" data-formula="${escapedLatex}" data-source-start="${startLine}" data-source-end="${endLine}">${svg}</span>`;
      replacements.push({ start: match.index, end: match.index + match[0].length, html });
    } catch (err: any) {
      warnings.push(`Formula SVG failed: ${err.message}`);
    }
  }

  // Apply in reverse order to preserve character indices
  replacements.sort((a, b) => b.start - a.start);
  let result = md;
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.html + result.slice(r.end);
  }
  return result;
}

// Post-process unified output to add mdnice-compatible HTML structure
function postProcessHtml(html: string): string {
  // 1. Wrap headings with mdnice-style spans
  html = html.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/g, (_, level, attrs, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    return `<h${level}${attrs}><span class="prefix"></span><span class="content">${text}</span><span class="suffix"></span></h${level}>`;
  });

  // 2. Add multiquote-N classes to nested blockquotes (handles attributes now)
  html = addMultiquoteClasses(html);

  // 3. Wrap <li> content in <section> for mdnice list styling (handles attributes now)
  html = html.replace(/<li([^>]*)>([\s\S]*?)<\/li>/g, (match, attrs, content: string) => {
    if (content.includes('<section')) return match;
    return `<li${attrs}><section>${content}</section></li>`;
  });

  return html;
}

function addMultiquoteClasses(html: string): string {
  let depth = 0;
  return html.replace(/<blockquote(\s[^>]*)?>/gi, (match, attrs) => {
    depth++;
    // Don't modify if already has a class attribute
    if (attrs && /\bclass\s*=\s*["']/.test(attrs)) return match;
    return `<blockquote class="multiquote-${depth}"${attrs || ''}>`;
  }).replace(/<\/blockquote>/gi, () => {
    depth = Math.max(0, depth - 1);
    return '</blockquote>';
  });
}

// --- Image processing (unchanged) ---

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

  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// Convert WeChat-unsafe inline CSS to safe alternatives
function sanitizeWechatStyles(html: string): string {
  return html.replace(/style="([^"]*)"/g, (_match, styleContent: string) => {
    const declarations = styleContent.split(';').map((d: string) => d.trim()).filter(Boolean);
    const result: string[] = [];

    for (const decl of declarations) {
      const propLower = decl.split(':')[0].trim().toLowerCase();

      if (propLower === 'background' || propLower === 'background-image') {
        if (decl.includes('linear-gradient')) {
          const colors = decl.match(/rgba?\(\s*\d+[^)]*\)|#[0-9a-fA-F]{3,8}/g);
          if (colors && colors.length >= 1) {
            result.push(`background-color: ${colors[0]}`);
          }
          continue;
        }
      }

      if (propLower === 'background' && decl.includes('none')) {
        continue;
      }

      result.push(decl);
    }

    const sanitized = result.join('; ');
    return `style="${sanitized}"`;
  });
}

export async function renderMarkdown(
  markdown: string,
  css: string,
  mdFilePath?: string,
  imageOptions: ImageProcessingOptions = DEFAULT_IMAGE_OPTIONS,
): Promise<RenderResult> {
  const warnings: string[] = [];
  const mdDir = mdFilePath ? path.dirname(mdFilePath) : process.cwd();

  // 1. Normalize LaTeX delimiters
  let processedMd = normalizeLatexDelimiters(markdown);

  // 2. Process local images to base64
  const imageMatches = [...processedMd.matchAll(IMAGE_RE)];
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

  // 3. Render math to SVG (pre-processing, before unified)
  try {
    processedMd = await renderMathInMarkdown(processedMd, warnings);
  } catch (err: any) {
    warnings.push(`Math rendering failed: ${err.message}`);
  }

  // 4. Unified pipeline: Markdown → HTML with source positions
  let htmlBody: string;
  try {
    htmlBody = await processMarkdown(processedMd);
  } catch (err: any) {
    warnings.push(`Markdown rendering failed: ${err.message}`);
    htmlBody = `<p>Rendering error: ${err.message}</p>`;
  }

  // 5. mdnice-compatible structure
  htmlBody = postProcessHtml(htmlBody);

  // 6. CSS inline with juice
  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body><section id="nice">${htmlBody}</section></body>
</html>`;

  let inlinedHtml = juice.inlineContent(fullHtml, css, {
    inlinePseudoElements: false,
    preserveImportant: true,
  });

  // 7. Sanitize inline styles for WeChat compatibility
  inlinedHtml = sanitizeWechatStyles(inlinedHtml);

  // 8. Extract #nice content for clipboard
  const niceMatch = inlinedHtml.match(/<section[^>]*id="nice"[^>]*>([\s\S]*)<\/section>/i);
  const clipboardHtml = niceMatch
    ? `<section id="nice">${niceMatch[1].trim()}</section>`
    : inlinedHtml;

  // 9. Stats
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
