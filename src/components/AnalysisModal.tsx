import React from 'react';
import { Button, Modal } from 'storybook/internal/components';

import type { AnalysisResult } from '../constants';

interface AnalysisModalProps {
  isOpen: boolean;
  result: AnalysisResult | null;
  onOpenChange: (isOpen: boolean) => void;
}

interface ImageViewerProps {
  title: string;
  src: string;
  alt: string;
  scale?: number;
  offset?: { x: number; y: number };
  isDarkMode?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
}

const ImageViewer = React.memo(function ImageViewer({
  title,
  src,
  alt,
  scale = 1,
  offset = { x: 0, y: 0 },
  isDarkMode = true,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: ImageViewerProps) {
  const bgColor = isDarkMode ? '#16191f' : '#f0f0f0';
  const textColor = isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.72)';

  return (
    <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', gap: '12px', flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: textColor }}>{title}</div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          background: bgColor,
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: scale > 1 ? 'grab' : 'default',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
});

interface SideBySideViewProps {
  result: AnalysisResult;
  scale: number;
  offset: { x: number; y: number };
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

const SideBySideView = React.memo(function SideBySideView({
  result,
  scale,
  offset,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: SideBySideViewProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        flex: 1,
        minHeight: 0,
      }}
    >
      <ImageViewer
        title="Figma"
        src={result.figmaSrc}
        alt="Figma overlay"
        scale={scale}
        offset={offset}
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
        scale={scale}
        offset={offset}
        isDarkMode={isDarkMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
});

interface OverlayViewProps {
  result: AnalysisResult;
  opacity: number;
  scale: number;
  offset: { x: number; y: number };
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

const OverlayView = React.memo(function OverlayView({
  result,
  opacity,
  scale,
  offset,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: OverlayViewProps) {
  const bgColor = isDarkMode ? '#16191f' : '#f0f0f0';

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          background: bgColor,
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: scale > 1 ? 'grab' : 'default',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          <img
            src={result.screenshotSrc}
            alt="Storybook screenshot base"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <img
            src={result.figmaSrc}
            alt="Figma overlay layer"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: opacity,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
});

interface DiffViewProps {
  result: AnalysisResult;
  scale: number;
  offset: { x: number; y: number };
  isDarkMode: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

const DiffView = React.memo(function DiffView({
  result,
  scale,
  offset,
  isDarkMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: DiffViewProps) {
  return (
    <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', gap: '12px', flex: 1 }}>
      <ImageViewer
        title="Diff"
        src={result.diffSrc}
        alt="Pixel diff"
        scale={scale}
        offset={offset}
        isDarkMode={isDarkMode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
});

export function AnalysisModal({ isOpen, result, onOpenChange }: AnalysisModalProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [mode, setMode] = React.useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = React.useState<number>(0.5);

  const [transform, setTransform] = React.useReducer(
    (
      state: { scale: number; offset: { x: number; y: number } },
      action:
        | { type: 'SET_SCALE'; payload: number }
        | { type: 'SET_OFFSET'; payload: { x: number; y: number } }
        | { type: 'RESET' },
    ) => {
      switch (action.type) {
        case 'SET_SCALE':
          return { ...state, scale: Math.min(Math.max(action.payload, 0.5), 10) };
        case 'SET_OFFSET':
          return { ...state, offset: action.payload };
        case 'RESET':
          return { scale: 1, offset: { x: 0, y: 0 } };
        default:
          return state;
      }
    },
    { scale: 1, offset: { x: 0, y: 0 } },
  );

  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const offsetRef = React.useRef(transform.offset);
  const animationFrameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    offsetRef.current = transform.offset;
  }, [transform.offset]);

  React.useEffect(() => {
    setTransform({ type: 'RESET' });
  }, [mode]);

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
        setTransform({
          type: 'SET_OFFSET',
          payload: {
            x: clientX - dragStartRef.current.x,
            y: clientY - dragStartRef.current.y,
          },
        });
      });
    },
    [isDragging],
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
      setTransform({
        type: 'SET_SCALE',
        payload: transform.scale * delta,
      });
    },
    [transform.scale],
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
      scale: transform.scale,
      offset: transform.offset,
      isDarkMode,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onWheel: handleWheel,
    }),
    [transform.scale, transform.offset, isDarkMode, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel],
  );

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange} ariaLabel="Figma analysis result" width="100vw" height="100vh">
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          background: '#0f1115',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 32px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div />
          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>
            {result ? `Similarity: ${result.similarity}%` : 'Analysis Result'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleDarkMode}
              ariaLabel="Toggle dark/light mode"
              style={{
                minWidth: '36px',
                padding: '0 8px',
                fontSize: '16px',
              }}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              ariaLabel="Close analysis modal"
            >
              Close
            </Button>
          </div>
        </div>

        {result && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 32px',
              background: '#16191f',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant={mode === 'side-by-side' ? 'solid' : 'outline'}
                onClick={() => setMode('side-by-side')}
                ariaLabel="Switch to side-by-side view"
                style={mode === 'side-by-side' ? { backgroundColor: '#006dea', color: '#ffffff' } : {}}
              >
                Side by Side
              </Button>
              <Button
                type="button"
                variant={mode === 'overlay' ? 'solid' : 'outline'}
                onClick={() => setMode('overlay')}
                ariaLabel="Switch to overlay view"
                style={mode === 'overlay' ? { backgroundColor: '#006dea', color: '#ffffff' } : {}}
              >
                Overlay
              </Button>
              <Button
                type="button"
                variant={mode === 'diff' ? 'solid' : 'outline'}
                onClick={() => setMode('diff')}
                ariaLabel="Switch to diff view"
                style={mode === 'diff' ? { backgroundColor: '#006dea', color: '#ffffff' } : {}}
              >
                Diff Only
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {mode === 'overlay' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                    Opacity:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(overlayOpacity * 100)}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '12px', width: '36px', color: 'rgba(255,255,255,0.8)' }}>
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransform({ type: 'SET_SCALE', payload: transform.scale / 1.2 })}
                ariaLabel="Zoom out"
                style={{ minWidth: '36px', padding: '0 8px' }}
              >
                -
              </Button>
              <span style={{ fontSize: '13px', width: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
                {Math.round(transform.scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransform({ type: 'SET_SCALE', payload: transform.scale * 1.2 })}
                ariaLabel="Zoom in"
                style={{ minWidth: '36px', padding: '0 8px' }}
              >
                +
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTransform({ type: 'RESET' });
                }}
                ariaLabel="Reset zoom"
                style={{ fontSize: '12px' }}
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            flexDirection: 'column',
            padding: '24px 32px 32px',
          }}
        >
          {result ? (
            <>
              {mode === 'side-by-side' && <SideBySideView result={result} {...viewProps} />}
              {mode === 'overlay' && <OverlayView result={result} opacity={overlayOpacity} {...viewProps} />}
              {mode === 'diff' && <DiffView result={result} {...viewProps} />}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8ccd4' }}>
              Hasil analisis belum tersedia.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
