import type { InkPostTheme } from '../types';

export const businessTheme: InkPostTheme = {
  id: 'preset-business',
  name: '商务',
  isBuiltIn: true,
  css: `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  line-height: 1.75;
  color: #2d2d2d;
  letter-spacing: 0.3px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin: 28px 0 16px;
  padding-bottom: 10px;
  border-bottom: 3px solid #1a5276;
}

h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1a5276;
  margin: 24px 0 10px;
  padding-left: 10px;
  border-left: 4px solid #1a5276;
}

h3 {
  font-size: 16px;
  font-weight: 700;
  color: #2d2d2d;
  margin: 20px 0 8px;
}

p {
  margin: 0 0 14px;
  text-align: justify;
}

strong {
  font-weight: 700;
  color: #1a1a1a;
}

a {
  color: #1a5276;
  text-decoration: none;
  border-bottom: 1px solid #1a5276;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px auto;
  border-radius: 2px;
}

blockquote {
  margin: 14px 0;
  padding: 12px 16px;
  border-left: 4px solid #1a5276;
  background-color: #eaf2f8;
  color: #555;
}

blockquote p {
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
  background-color: #eaf2f8;
  padding: 2px 6px;
  border-radius: 3px;
  color: #922b21;
}

pre {
  margin: 14px 0;
  padding: 16px;
  background-color: #f4f6f7;
  border: 1px solid #d5dbdb;
  border-radius: 2px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

pre code {
  background: none;
  padding: 0;
  color: #2d2d2d;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 14px;
}

th {
  background-color: #1a5276;
  color: #fff;
  font-weight: 600;
}

th, td {
  padding: 10px 14px;
  border: 1px solid #d5dbdb;
}

tr:nth-child(even) td {
  background-color: #f4f6f7;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 2px solid #1a5276;
  opacity: 0.3;
}

ul, ol {
  margin: 0 0 14px;
  padding-left: 24px;
}

li {
  margin-bottom: 4px;
}

.block-1 {
  background-color: #eaf2f8;
  border: 1px solid #c8d8e8;
  border-left: 4px solid #1a5276;
  border-radius: 2px;
  padding: 14px 16px;
  margin: 14px 0;
}
.block-1 p { color: #2c4050; margin: 0; }

.block-2 {
  background-color: #fdf2e9;
  border: 1px solid #e8d0b8;
  border-left: 4px solid #ca6f1e;
  border-radius: 2px;
  padding: 14px 16px;
  margin: 14px 0;
}
.block-2 p { color: #5a4030; margin: 0; }
.block-2 strong { color: #a04000; }

.block-3 {
  background-color: #f4f6f7;
  border: 1px solid #d5dbdb;
  border-left: 4px solid #2d2d2d;
  border-radius: 2px;
  padding: 14px 16px;
  margin: 14px 0;
}
.block-3 p { color: #444; margin: 0; }
.block-3 strong { color: #1a1a1a; }
`.trim(),
};
