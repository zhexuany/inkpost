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
const mathjaxNode = require('mathjax-node');
const texmathPlugin = texmath.use(katex);
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(footnote).use(texmathPlugin);

// Configure mathjax-node: disable fontCache to avoid id attrs (WeChat strips SVG id)
mathjaxNode.config({
  MathJax: {
    tex2jax: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
  },
});

// Normalize LaTeX delimiters: \[...\] → $$...$$, \(...\) → $...$
function normalizeLatexDelimiters(md: string): string {
  md = md.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `$$${formula}$$`);
  md = md.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula}$`);
  return md;
}

// Render a single formula as SVG using mathjax-node (no id attributes)
function renderFormulaSvg(latex: string, display: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    mathjaxNode.typeset({
      math: latex,
      format: 'TeX',
      svg: true,
      useFontCache: false,
      linebreaks: !display,
      display: display,
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

// Replace KaTeX HTML output with mdnice-compatible SVG structure
async function replaceKatexWithSvg(html: string): Promise<string> {
  html = await replaceDisplayMath(html);
  html = await replaceInlineMath(html);
  return html;
}

async function replaceDisplayMath(html: string): Promise<string> {
  // texmath wraps display math in <section><eqn>...</eqn></section>
  const displayRe = /<section><eqn[^>]*>([\s\S]*?)<\/eqn><\/section>/g;
  const matches = [...html.matchAll(displayRe)];

  for (const match of matches) {
    const latex = extractLatex(match[1]);
    if (!latex) continue;
    try {
      const svg = await renderFormulaSvg(latex, true);
      // Match mdnice structure: <span class="span-block-equation"><section class="block-equation">
      const escapedLatex = latex.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
      const wrapped = `<span class="span-block-equation" style="cursor:pointer"><section class="block-equation" data-formula="${escapedLatex}" style="text-align: center; overflow-x: auto; overflow-y: auto; display: block;">${svg}</section></span>`;
      html = html.replace(match[0], wrapped);
    } catch {
      // Keep original KaTeX HTML as fallback
    }
  }

  // Handle <eqn> without <section> wrapper (edge case)
  const bareDisplayRe = /<eqn[^>]*>([\s\S]*?)<\/eqn>/g;
  const bareMatches = [...html.matchAll(bareDisplayRe)];
  for (const match of bareMatches) {
    const latex = extractLatex(match[1]);
    if (!latex) continue;
    try {
      const svg = await renderFormulaSvg(latex, true);
      const escapedLatex = latex.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
      const wrapped = `<span class="span-block-equation" style="cursor:pointer"><section class="block-equation" data-formula="${escapedLatex}" style="text-align: center; overflow-x: auto; overflow-y: auto; display: block;">${svg}</section></span>`;
      html = html.replace(match[0], wrapped);
    } catch {
      // Keep original
    }
  }

  return html;
}

async function replaceInlineMath(html: string): Promise<string> {
  const inlineRe = /<eq>([\s\S]*?)<\/eq>/g;
  const matches = [...html.matchAll(inlineRe)];

  for (const match of matches) {
    const latex = extractLatex(match[1]);
    if (!latex) continue;
    try {
      const svg = await renderFormulaSvg(latex, false);
      // Inline math: wrap in <span class="span-inline-equation">
      const escapedLatex = latex.replace(/"/g, '&quot;');
      const wrapped = `<span class="span-inline-equation" style="cursor:pointer" data-formula="${escapedLatex}">${svg}</span>`;
      html = html.replace(match[0], wrapped);
    } catch {
      // Keep original KaTeX HTML as fallback
    }
  }

  return html;
}

// Extract LaTeX source from KaTeX HTML output
function extractLatex(katexHtml: string): string | null {
  const annotRe = /<annotation[^>]*>([\s\S]*?)<\/annotation>/;
  const m = katexHtml.match(annotRe);
  if (m) return m[1];

  const labelRe = /aria-label="([^"]*)"/;
  const lm = katexHtml.match(labelRe);
  if (lm) return lm[1];

  const text = katexHtml.replace(/<[^>]+>/g, '').trim();
  return text.length > 0 ? text : null;
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
    if (content.includes('<section')) return match;
    return `<li><section>${content}</section></li>`;
  });

  return html;
}

function addMultiquoteClasses(html: string): string {
  let depth = 0;
  let result = '';
  let i = 0;

  while (i < html.length) {
    if (html.substring(i, i + 12) === '<blockquote>') {
      depth++;
      result += `<blockquote class="multiquote-${depth}">`;
      i += 12;
    } else if (html.substring(i, i + 13) === '</blockquote>') {
      result += '</blockquote>';
      if (depth > 0) depth--;
      i += 13;
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

  // Render markdown to HTML (includes KaTeX via texmath)
  let htmlBody = md.render(processedMd);

  // Replace KaTeX HTML with SVG in mdnice-compatible structure
  try {
    htmlBody = await replaceKatexWithSvg(htmlBody);
  } catch (err: any) {
    warnings.push(`Formula SVG conversion failed: ${err.message}`);
  }

  // Add mdnice-compatible structure
  htmlBody = postProcessHtml(htmlBody);

  // Wrap in #nice container for mdnice CSS compatibility
  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body><section id="nice">${htmlBody}</section></body>
</html>`;

  // Only inline user CSS (SVG formulas don't need KaTeX CSS)
  const inlinedHtml = juice.inlineContent(fullHtml, css, {
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
