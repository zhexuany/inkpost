import React, { useState, useEffect } from 'react';
import { t } from '../shared/i18n';

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
        {isRendering && <span className="status-indicator">{t('status.rendering')}</span>}
        <span>{wordCount} {t('status.words')}</span>
        <span>{imageCount} {t('status.images')}</span>
        <span>{totalSizeKB} KB</span>
      </div>
      <div className="status-right">
        {warnings.length > 0 && (
          <>
            <button className="warning-btn" onClick={() => setShowWarnings(!showWarnings)}>
              {warnings.length} {t('status.warnings')}
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
