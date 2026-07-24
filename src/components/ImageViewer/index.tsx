import React from 'react';
import { styled } from 'storybook/theming';

import { useTransform } from './TransformContext';

export { TransformProvider, useTransform } from './TransformContext';

export const ViewerContainer = styled.div({
  display: 'flex',
  minHeight: 0,
  flexDirection: 'column',
  gap: '12px',
  flex: 1,
});

const ViewerTitle = styled.div({
  fontSize: '14px',
  fontWeight: 600,
});

export const ViewerViewport = styled.div<{ $bgColor: string; $scale: number; $isPannable?: boolean }>(
  ({ $bgColor, $scale, $isPannable }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: '12px',
    background: $bgColor,
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: $isPannable || $scale > 1 ? 'grab' : 'default',
    touchAction: 'none',
    userSelect: 'none',
  }),
);

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
  isPannable?: boolean;
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
  isPannable = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: ImageViewerProps) {
  const { scale, offset } = useTransform();
  const bgColor = isDarkMode ? '#16191f' : '#f0f0f0';

  return (
    <ViewerContainer>
      {title && <ViewerTitle>{title}</ViewerTitle>}
      <ViewerViewport
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        $bgColor={bgColor}
        $scale={scale}
        $isPannable={isPannable}
      >
        <ViewerTransformContainer $transform={`translate(${offset.x}px, ${offset.y}px) scale(${scale})`}>
          <ViewerImage src={src} alt={alt} loading="lazy" />
        </ViewerTransformContainer>
      </ViewerViewport>
    </ViewerContainer>
  );
});
