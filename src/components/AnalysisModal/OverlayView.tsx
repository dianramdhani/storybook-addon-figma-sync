import React from 'react';
import { styled } from 'storybook/theming';

import type { AnalysisResult } from '../../constants';
import { ViewerViewport } from './ImageViewer';
import { useTransform } from './TransformContext';

const OverlayContainer = styled.div({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

const OverlayTransformContainer = styled.div<{ $transform: string }>(({ $transform }) => ({
  position: 'relative',
  maxWidth: '100%',
  maxHeight: '100%',
  transform: $transform,
  transformOrigin: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',
  willChange: 'transform',
}));

const OverlayBaseImage = styled.img({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
});

const OverlayLayerImage = styled.img<{ $opacity: number }>(({ $opacity }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: $opacity,
  pointerEvents: 'none',
  userSelect: 'none',
}));

export interface OverlayViewProps {
  result: AnalysisResult;
  opacity: number;
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export const OverlayView = React.memo(function OverlayView({
  result,
  opacity,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: OverlayViewProps) {
  const { scale, offset } = useTransform();
  const bgColor = isDarkMode ? '#16191f' : '#f0f0f0';

  return (
    <OverlayContainer>
      <ViewerViewport
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        $bgColor={bgColor}
        $scale={scale}
      >
        <OverlayTransformContainer $transform={`translate(${offset.x}px, ${offset.y}px) scale(${scale})`}>
          <OverlayBaseImage src={result.screenshotSrc} alt="Storybook screenshot base" />
          <OverlayLayerImage src={result.figmaSrc} alt="Figma overlay layer" $opacity={opacity} />
        </OverlayTransformContainer>
      </ViewerViewport>
    </OverlayContainer>
  );
});
