import React from 'react';
import { styled } from 'storybook/theming';

import type { AnalysisResult } from '../../constants';
import { ImageViewer } from './ImageViewer';

const SideBySideContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
  flex: 1,
  minHeight: 0,
});

export interface SideBySideViewProps {
  result: AnalysisResult;
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export const SideBySideView = React.memo(function SideBySideView({
  result,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: SideBySideViewProps) {
  return (
    <SideBySideContainer>
      <ImageViewer
        title="Figma"
        src={result.figmaSrc}
        alt="Figma overlay"
        isDarkMode={isDarkMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
      <ImageViewer
        title="Screenshot"
        src={result.screenshotSrc}
        alt="Storybook screenshot"
        isDarkMode={isDarkMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </SideBySideContainer>
  );
});
