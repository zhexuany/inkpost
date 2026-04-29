import React, { useState, useEffect } from 'react';

interface StatusBarProps {
  wordCount: number;
  imageCount: number;
  totalSizeKB: number;
  warnings: string[];
  isRendering: boolean;
}

export default function StatusBar({ wordCount, imageCount, totalSizeKB, warnings, isRendering }: StatusBarProps) {
  const [showWarnings, setShowWarnings] = useState(false);

  return (
    <div className="status-bar">
      <div className="status-left">
        {isRendering && <span className="status-indicator">渲染中...</span>}
        <span>{wordCount} 字</span>
        <span>{imageCount} 张图片</span>
        <span>{totalSizeKB} KB</span>
      </div>
      <div className="status-right">
        {warnings.length > 0 && (
          <>
            <button className="warning-btn" onClick={() => setShowWarnings(!showWarnings)}>
              {warnings.length} 个警告
            </button>
            {showWarnings && (
              <div className="warning-popup">
                {warnings.map((w, i) => (
                  <div key={i} className="warning-item">{w}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
