import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import juice from 'juice';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import type { ImageProcessingOptions, RenderResult } from '../shared/types';
import { DEFAULT_IMAGE_OPTIONS } from '../shared/types';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(footnote);

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

  // Resize if wider than maxWidth
  if (metadata.width && metadata.width > options.maxWidth) {
    pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true });
  }

  // Convert to buffer
  const buf = await pipeline
    .jpeg({ quality: options.quality })
    .toBuffer();

  const sizeKB = buf.length / 1024;
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

  // Collect local images
  const imageMatches = [...markdown.matchAll(IMAGE_RE)];
  let processedMd = markdown;

  // Process images: replace local paths with base64
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
  const htmlBody = md.render(processedMd);

  // Wrap with style tag and inline CSS
  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>${htmlBody}</body>
</html>`;

  const inlinedHtml = juice.inlineContent(fullHtml, css, {
    inlinePseudoElements: false,
    preserveImportant: true,
  });

  // Extract just the body content for clipboard
  const bodyMatch = inlinedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const clipboardHtml = bodyMatch ? bodyMatch[1].trim() : inlinedHtml;

  // Stats
  const textContent = markdown.replace(/!\[([^\]]*)\]\([^)]+\)/g, '').replace(/[#*`>\[\]()_-]/g, '');
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
