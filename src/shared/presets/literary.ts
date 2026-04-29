import type { InkPostTheme } from '../types';

export const literaryTheme: InkPostTheme = {
  id: 'preset-literary',
  name: '文艺',
  isBuiltIn: true,
  css: `
body {
  font-family: "Georgia", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  font-size: 16px;
  line-height: 2;
  color: #3f3f3f;
  letter-spacing: 1px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: #2b2b2b;
  margin: 32px 0 20px;
  letter-spacing: 2px;
}

h2 {
  font-size: 19px;
  font-weight: 700;
  color: #2b2b2b;
  margin: 28px 0 12px;
  padding-left: 12px;
  border-left: 3px solid #8b7355;
}

h3 {
  font-size: 17px;
  font-weight: 700;
  color: #4a4a4a;
  margin: 24px 0 8px;
}

p {
  margin: 0 0 18px;
  text-indent: 2em;
  text-align: justify;
}

strong {
  font-weight: 700;
  color: #2b2b2b;
}

a {
  color: #8b7355;
  text-decoration: none;
  border-bottom: 1px solid #8b7355;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border-radius: 2px;
}

blockquote {
  margin: 20px 0;
  padding: 12px 20px;
  border-left: 3px solid #c4a882;
  background-color: #faf8f5;
  color: #666;
  font-style: italic;
}

blockquote p {
  text-indent: 0;
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  background-color: #f5f0e8;
  padding: 2px 6px;
  border-radius: 3px;
  color: #8b4513;
}

pre {
  margin: 18px 0;
  padding: 16px;
  background-color: #faf8f5;
  border: 1px solid #e8e0d4;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

pre code {
  background: none;
  padding: 0;
  color: #3f3f3f;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  font-size: 15px;
}

th {
  background-color: #f5f0e8;
  font-weight: 700;
}

th, td {
  padding: 8px 12px;
  border: 1px solid #e8e0d4;
}

hr {
  margin: 28px auto;
  width: 60%;
  border: none;
  border-top: 1px solid #d4c8b0;
}

ul, ol {
  margin: 0 0 18px;
  padding-left: 28px;
}

li {
  margin-bottom: 6px;
}

.block-1 {
  background-color: #faf5ed;
  border: 1px solid #e8dcc8;
  border-left: 4px solid #8b7355;
  border-radius: 2px;
  padding: 14px 18px;
  margin: 18px 0;
}
.block-1 p { color: #5a4a3a; text-indent: 0; margin: 0; }

.block-2 {
  background-color: #fdf6ee;
  border: 1px solid #e8d4b8;
  border-left: 4px solid #b8860b;
  border-radius: 2px;
  padding: 14px 18px;
  margin: 18px 0;
}
.block-2 p { color: #5a4a2a; text-indent: 0; margin: 0; }
.block-2 strong { color: #8b6914; }

.block-3 {
  background-color: #f5f0e8;
  border: 1px solid #d4c8b0;
  border-left: 4px solid #6b5b4a;
  border-radius: 2px;
  padding: 14px 18px;
  margin: 18px 0;
}
.block-3 p { color: #4a4a4a; text-indent: 0; margin: 0; }
.block-3 strong { color: #3f3f3f; }
`.trim(),
};
