import React from 'react';

import type { AnalysisResult } from '../../constants';
import { ImageViewer, ViewerContainer } from './ImageViewer';

export interface DiffViewProps {
  result: AnalysisResult;
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export const DiffView = React.memo(function DiffView({
  result,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: DiffViewProps) {
  return (
    <ViewerContainer>
      <ImageViewer
        title="Diff"
        src={result.diffSrc}
        alt="Pixel diff"
        isDarkMode={isDarkMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </ViewerContainer>
  );
});
