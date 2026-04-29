import type { InkPostTheme } from '../types';

export const darkTheme: InkPostTheme = {
  id: 'preset-dark',
  name: '深色',
  isBuiltIn: true,
  css: `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #e0e0e0;
  background-color: #1e1e1e;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: #f0f0f0;
  margin: 28px 0 16px;
}

h2 {
  font-size: 19px;
  font-weight: 700;
  color: #f0f0f0;
  margin: 24px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #444;
}

h3 {
  font-size: 17px;
  font-weight: 700;
  color: #d0d0d0;
  margin: 20px 0 8px;
}

p {
  margin: 0 0 14px;
  text-align: justify;
}

strong {
  font-weight: 700;
  color: #f0f0f0;
}

a {
  color: #73c2fb;
  text-decoration: none;
  border-bottom: 1px solid #73c2fb;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
  border-radius: 4px;
  opacity: 0.95;
}

blockquote {
  margin: 14px 0;
  padding: 12px 16px;
  border-left: 3px solid #555;
  background-color: #2a2a2a;
  color: #aaa;
}

blockquote p {
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  background-color: #333;
  padding: 2px 6px;
  border-radius: 3px;
  color: #e06c75;
}

pre {
  margin: 14px 0;
  padding: 16px;
  background-color: #282c34;
  border-radius: 6px;
  border: 1px solid #3a3f47;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

pre code {
  background: none;
  padding: 0;
  color: #abb2bf;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 15px;
}

th {
  background-color: #333;
  font-weight: 600;
  color: #f0f0f0;
}

th, td {
  padding: 8px 12px;
  border: 1px solid #444;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #444;
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
