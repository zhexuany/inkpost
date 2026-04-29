import type { InkPostTheme } from '../types';

export const techTheme: InkPostTheme = {
  id: 'preset-tech',
  name: '科技',
  isBuiltIn: true,
  css: `
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  font-size: 15px;
  line-height: 1.75;
  color: #2c3e50;
  letter-spacing: 0.3px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 28px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #3498db;
}

h2 {
  font-size: 19px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 24px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ecf0f1;
}

h3 {
  font-size: 17px;
  font-weight: 700;
  color: #2c3e50;
  margin: 20px 0 8px;
}

p {
  margin: 0 0 14px;
  text-align: justify;
}

strong {
  font-weight: 700;
  color: #1a1a2e;
}

a {
  color: #3498db;
  text-decoration: none;
  border-bottom: 1px dashed #3498db;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
  border-radius: 4px;
  border: 1px solid #ecf0f1;
}

blockquote {
  margin: 14px 0;
  padding: 12px 16px;
  border-left: 4px solid #3498db;
  background-color: #f8f9fa;
  color: #555;
  font-size: 14px;
}

blockquote p {
  margin: 0;
}

code {
  font-family: "SF Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  background-color: #f0f3f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #c0392b;
}

pre {
  margin: 14px 0;
  padding: 16px;
  background-color: #2c3e50;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

pre code {
  background: none;
  padding: 0;
  color: #ecf0f1;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 14px;
}

th {
  background-color: #3498db;
  color: #fff;
  font-weight: 600;
}

th, td {
  padding: 10px 14px;
  border: 1px solid #ddd;
}

tr:nth-child(even) td {
  background-color: #f8f9fa;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #ecf0f1;
}

ul, ol {
  margin: 0 0 14px;
  padding-left: 24px;
}

li {
  margin-bottom: 4px;
}
`.trim(),
};
