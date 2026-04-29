import React, { useRef, useEffect } from 'react';

interface PreviewProps {
  html: string;
}

export default function Preview({ html }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  margin: 0;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  background: #fff;
}
</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="preview-iframe"
      sandbox="allow-same-origin"
      title="Preview"
    />
  );
}
