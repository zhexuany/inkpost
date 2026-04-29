import type { InkPostTheme } from './types';

export const DEFAULT_THEME_ID = 'inkpost-default';

export const defaultTheme: InkPostTheme = {
  id: DEFAULT_THEME_ID,
  name: '默认主题',
  isBuiltIn: true,
  css: `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC",
    "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC",
    "WenQuanYi Micro Hei", sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  word-break: break-word;
  letter-spacing: 0.5px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin: 24px 0 16px;
  line-height: 1.4;
}

h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 28px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 24px 0 8px;
}

p {
  margin: 0 0 16px;
  text-align: justify;
}

strong {
  font-weight: 700;
  color: #1a1a1a;
}

em {
  font-style: italic;
  color: #555;
}

a {
  color: #576b95;
  text-decoration: none;
  border-bottom: 1px solid #576b95;
}

img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
  display: block;
}

blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 3px solid #576b95;
  background-color: #f7f7f7;
  color: #666;
  font-size: 15px;
}

blockquote p {
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  color: #c7254e;
}

pre {
  margin: 16px 0;
  padding: 16px;
  background-color: #f6f8fa;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

pre code {
  background: none;
  padding: 0;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 15px;
}

th {
  background-color: #f6f8fa;
  font-weight: 700;
  text-align: left;
}

th, td {
  padding: 8px 12px;
  border: 1px solid #ddd;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #eee;
}

ul, ol {
  margin: 0 0 16px;
  padding-left: 24px;
}

li {
  margin-bottom: 4px;
}

.footnote-ref {
  font-size: 12px;
  vertical-align: super;
  color: #576b95;
}

.block-1 {
  background-color: #f0f5ff;
  border: 1px solid #d4e4ff;
  border-left: 4px solid #576b95;
  border-radius: 4px;
  padding: 14px 16px;
  margin: 16px 0;
}
.block-1 p { color: #3a4a6b; margin: 0; }

.block-2 {
  background-color: #fff8f0;
  border: 1px solid #ffe0c0;
  border-left: 4px solid #e8833a;
  border-radius: 4px;
  padding: 14px 16px;
  margin: 16px 0;
}
.block-2 p { color: #5a3a1a; margin: 0; }
.block-2 strong { color: #c75a10; }

.block-3 {
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  border-left: 4px solid #333;
  border-radius: 4px;
  padding: 14px 16px;
  margin: 16px 0;
}
.block-3 p { color: #444; margin: 0; }
.block-3 strong { color: #1a1a1a; }

.info { background-color: #e8f4fd; border-left: 4px solid #576b95; border-radius: 4px; padding: 14px 16px; margin: 16px 0; }
.info p { color: #2c4a6b; margin: 0; }

.tip { background-color: #edf7ed; border-left: 4px solid #4caf50; border-radius: 4px; padding: 14px 16px; margin: 16px 0; }
.tip p { color: #2e5a2e; margin: 0; }

.warning { background-color: #fff8e1; border-left: 4px solid #ff9800; border-radius: 4px; padding: 14px 16px; margin: 16px 0; }
.warning p { color: #6d4c00; margin: 0; }

.danger { background-color: #fde8e8; border-left: 4px solid #e53935; border-radius: 4px; padding: 14px 16px; margin: 16px 0; }
.danger p { color: #8b1a1a; margin: 0; }

.card { padding: 14px 16px; margin: 16px 0; border-radius: 4px; border: 1px solid #e0e0e0; }
.card p { margin: 4px 0; }
`.trim(),
};
