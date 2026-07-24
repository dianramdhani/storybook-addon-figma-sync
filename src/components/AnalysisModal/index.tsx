import React from 'react';
import { Button, Modal } from 'storybook/internal/components';
import { styled } from 'storybook/theming';

import type { AnalysisResult } from '../../constants';
import { TransformProvider, useTransform } from '../ImageViewer';
import { DiffView } from './DiffView';
import { OverlayView } from './OverlayView';
import { SideBySideView } from './SideBySideView';

const ModalContent = styled.div({
  display: 'flex',
  height: '100%',
  width: '100%',
  flexDirection: 'column',
  background: '#0f1115',
  color: '#fff',
});

const ModalHeader = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '16px',
  padding: '24px 32px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
});

const ModalTitle = styled.div({
  fontSize: '24px',
  fontWeight: 700,
  textAlign: 'center',
});

const HeaderRight = styled.div({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
});

const ThemeButton = styled(Button)({
  minWidth: '36px',
  padding: '0 8px',
  fontSize: '16px',
});

const Toolbar = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 32px',
  background: '#16191f',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
});

const ButtonGroup = styled.div({
  display: 'flex',
  gap: '8px',
});

const TabButton = styled(Button)<{ $isActive?: boolean }>(({ $isActive }) =>
  $isActive ? { backgroundColor: '#006dea', color: '#ffffff' } : {},
);

const ToolbarControls = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const OpacityControl = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const OpacityLabel = styled.span({
  fontSize: '12px',
  color: 'rgba(255,255,255,0.6)',
  whiteSpace: 'nowrap',
});

const OpacitySlider = styled.input({
  width: '120px',
});

const OpacityValue = styled.span({
  fontSize: '12px',
  width: '36px',
  color: 'rgba(255,255,255,0.8)',
});

const ScaleButton = styled(Button)({
  minWidth: '36px',
  padding: '0 8px',
});

const ScaleValue = styled.span({
  fontSize: '13px',
  width: '48px',
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
});

const ResetButton = styled(Button)({
  fontSize: '12px',
});

const ModalBody = styled.div({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  flexDirection: 'column',
  padding: '24px 32px 32px',
});

const EmptyResult = styled.div({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#c8ccd4',
});

interface AnalysisModalProps {
  isOpen: boolean;
  result: AnalysisResult | null;
  onOpenChange: (isOpen: boolean) => void;
}

function AnalysisModalContent({ isOpen, result, onOpenChange }: AnalysisModalProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [mode, setMode] = React.useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = React.useState<number>(0.5);

  const { scale, setScale, offset, setOffset } = useTransform();

  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const offsetRef = React.useRef(offset);
  const animationFrameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  React.useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [mode, setScale, setOffset]);

  const handlePointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);

      const clientX = e.clientX;
      const clientY = e.clientY;

      animationFrameRef.current = requestAnimationFrame(() => {
        setOffset({
          x: clientX - dragStartRef.current.x,
          y: clientY - dragStartRef.current.y,
        });
      });
    },
    [isDragging, setOffset],
  );

  const handlePointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  }, []);

  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const zoomFactor = 1.1;
      const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
      setScale((s) => Math.min(Math.max(s * delta, 0.5), 10));
    },
    [setScale],
  );

  const handleToggleDarkMode = React.useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const viewProps = React.useMemo(
    () => ({
      isDarkMode,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onWheel: handleWheel,
    }),
    [isDarkMode, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel],
  );

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange} ariaLabel="Figma analysis result" width="100vw" height="100vh">
      <ModalContent>
        <ModalHeader>
          <div />
          <ModalTitle>{result ? `Similarity: ${result.similarity}%` : 'Analysis Result'}</ModalTitle>
          <HeaderRight>
            <ThemeButton
              type="button"
              variant="outline"
              onClick={handleToggleDarkMode}
              ariaLabel="Toggle dark/light mode"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </ThemeButton>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              ariaLabel="Close analysis modal"
            >
              Close
            </Button>
          </HeaderRight>
        </ModalHeader>

        {result && (
          <Toolbar>
            <ButtonGroup>
              <TabButton
                type="button"
                variant={mode === 'side-by-side' ? 'solid' : 'outline'}
                onClick={() => setMode('side-by-side')}
                ariaLabel="Switch to side-by-side view"
                $isActive={mode === 'side-by-side'}
              >
                Side by Side
              </TabButton>
              <TabButton
                type="button"
                variant={mode === 'overlay' ? 'solid' : 'outline'}
                onClick={() => setMode('overlay')}
                ariaLabel="Switch to overlay view"
                $isActive={mode === 'overlay'}
              >
                Overlay
              </TabButton>
              <TabButton
                type="button"
                variant={mode === 'diff' ? 'solid' : 'outline'}
                onClick={() => setMode('diff')}
                ariaLabel="Switch to diff view"
                $isActive={mode === 'diff'}
              >
                Diff Only
              </TabButton>
            </ButtonGroup>

            <ToolbarControls>
              {mode === 'overlay' && (
                <OpacityControl>
                  <OpacityLabel>Opacity:</OpacityLabel>
                  <OpacitySlider
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(overlayOpacity * 100)}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                  />
                  <OpacityValue>{Math.round(overlayOpacity * 100)}%</OpacityValue>
                </OpacityControl>
              )}
              <ScaleButton
                type="button"
                variant="outline"
                onClick={() => setScale((s) => Math.min(Math.max(s / 1.2, 0.5), 10))}
                ariaLabel="Zoom out"
              >
                -
              </ScaleButton>
              <ScaleValue>{Math.round(scale * 100)}%</ScaleValue>
              <ScaleButton
                type="button"
                variant="outline"
                onClick={() => setScale((s) => Math.min(Math.max(s * 1.2, 0.5), 10))}
                ariaLabel="Zoom in"
              >
                +
              </ScaleButton>
              <ResetButton
                type="button"
                variant="outline"
                onClick={() => {
                  setScale(1);
                  setOffset({ x: 0, y: 0 });
                }}
                ariaLabel="Reset zoom"
              >
                Reset
              </ResetButton>
            </ToolbarControls>
          </Toolbar>
        )}

        <ModalBody>
          {result ? (
            <>
              {mode === 'side-by-side' && <SideBySideView result={result} {...viewProps} />}
              {mode === 'overlay' && <OverlayView result={result} opacity={overlayOpacity} {...viewProps} />}
              {mode === 'diff' && <DiffView result={result} {...viewProps} />}
            </>
          ) : (
            <EmptyResult>Hasil analisis belum tersedia.</EmptyResult>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function AnalysisModal(props: AnalysisModalProps) {
  return (
    <TransformProvider>
      <AnalysisModalContent {...props} />
    </TransformProvider>
  );
}
