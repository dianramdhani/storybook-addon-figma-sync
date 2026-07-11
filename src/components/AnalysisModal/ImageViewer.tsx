import React from 'react';
import { styled } from 'storybook/theming';

import { useTransform } from './TransformContext';

export const ViewerContainer = styled.div({
  display: 'flex',
  minHeight: 0,
  flexDirection: 'column',
  gap: '12px',
  flex: 1,
});

const ViewerTitle = styled.div<{ $textColor: string }>(({ $textColor }) => ({
  fontSize: '14px',
  fontWeight: 600,
  color: $textColor,
}));

export const ViewerViewport = styled.div<{ $bgColor: string; $scale: number }>(({ $bgColor, $scale }) => ({
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  borderRadius: '12px',
  background: $bgColor,
  padding: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: $scale > 1 ? 'grab' : 'default',
  touchAction: 'none',
  userSelect: 'none',
}));

const ViewerTransformContainer = styled.div<{ $transform: string }>(({ $transform }) => ({
  transform: $transform,
  transformOrigin: 'center',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',
  willChange: 'transform',
}));

const ViewerImage = styled.img({
  display: 'block',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  userSelect: 'none',
  pointerEvents: 'none',
});

export interface ImageViewerProps {
  title: string;
  src: string;
  alt: string;
  isDarkMode?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export const ImageViewer = React.memo(function ImageViewer({
  title,
  src,
  alt,
  isDarkMode = true,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: ImageViewerProps) {
  const { scale, offset } = useTransform();
  const bgColor = isDarkMode ? '#16191f' : '#f0f0f0';
  const textColor = isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.72)';

  return (
    <ViewerContainer>
      <ViewerTitle $textColor={textColor}>{title}</ViewerTitle>
      <ViewerViewport
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        $bgColor={bgColor}
        $scale={scale}
      >
        <ViewerTransformContainer $transform={`translate(${offset.x}px, ${offset.y}px) scale(${scale})`}>
          <ViewerImage src={src} alt={alt} loading="lazy" />
        </ViewerTransformContainer>
      </ViewerViewport>
    </ViewerContainer>
  );
});
