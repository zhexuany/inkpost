import type { InkPostTheme } from '../types';

export const minimalTheme: InkPostTheme = {
  id: 'preset-minimal',
  name: '简约',
  isBuiltIn: true,
  css: `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

h1 {
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  color: #111;
  margin: 28px 0 16px;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 24px 0 10px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin: 20px 0 8px;
}

p {
  margin: 0 0 14px;
}

strong {
  font-weight: 600;
  color: #111;
}

a {
  color: #333;
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
}

blockquote {
  margin: 14px 0;
  padding: 8px 16px;
  border-left: 2px solid #ccc;
  color: #888;
}

blockquote p {
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  color: #d14;
}

pre {
  margin: 14px 0;
  padding: 14px;
  background-color: #f5f5f5;
  border-radius: 2px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

pre code {
  background: none;
  padding: 0;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 15px;
}

th {
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

th, td {
  padding: 8px 10px;
  text-align: left;
}

td {
  border-bottom: 1px solid #eee;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #eee;
}

ul, ol {
  margin: 0 0 14px;
  padding-left: 24px;
}

li {
  margin-bottom: 4px;
}

.block-1 {
  border-left: 3px solid #999;
  padding: 10px 16px;
  margin: 14px 0;
  background-color: #fafafa;
}
.block-1 p { color: #555; margin: 0; }

.block-2 {
  border-left: 3px solid #333;
  padding: 10px 16px;
  margin: 14px 0;
  background-color: #f5f5f5;
}
.block-2 p { color: #333; margin: 0; }
.block-2 strong { color: #111; }

.block-3 {
  border-left: 3px solid #bbb;
  padding: 10px 16px;
  margin: 14px 0;
}
.block-3 p { color: #666; margin: 0; }
.block-3 strong { color: #333; }

.info { border-left: 3px solid #576b95; padding: 10px 16px; margin: 14px 0; }
.info p { color: #444; margin: 0; }

.tip { border-left: 3px solid #4caf50; padding: 10px 16px; margin: 14px 0; }
.tip p { color: #444; margin: 0; }

.warning { border-left: 3px solid #ff9800; padding: 10px 16px; margin: 14px 0; }
.warning p { color: #444; margin: 0; }

.danger { border-left: 3px solid #e53935; padding: 10px 16px; margin: 14px 0; }
.danger p { color: #444; margin: 0; }

.card { padding: 12px 16px; margin: 14px 0; }
.card p { margin: 4px 0; }
`.trim(),
};
