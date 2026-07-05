import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Button, Form, PopoverProvider } from 'storybook/internal/components';
import { useChannel, useGlobals, useStorybookApi } from 'storybook/manager-api';

import {
  type AnalysisResult,
  CHANNEL_ANALYSIS_ERROR,
  CHANNEL_ANALYSIS_READY,
  CHANNEL_DELETE_SCREENSHOT,
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_REQUEST_SCREENSHOT,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  getStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VISIBLE_KEY,
  type OverlayReadyPayload,
  type RequestScreenshotPayload,
  URL_PARAM_OVERLAY_OPACITY,
  URL_PARAM_OVERLAY_VISIBLE,
} from '../constants';
import { AnalysisModal } from './AnalysisModal';

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600 }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>{children}</div>
    </div>
  );
}

export const FigmaSyncTool = memo(function FigmaSyncTool() {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const storyId = api.getCurrentStoryData()?.id || '';

  const figmaUrl = (globals[FIGMA_URL_KEY] as string) || '';
  const showOverlay = Boolean(globals[OVERLAY_VISIBLE_KEY]);
  const overlayOpacity = Math.round(((globals[OVERLAY_OPACITY_KEY] as number | undefined) ?? 0.5) * 100);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchMessage, setFetchMessage] = useState('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [overlayVersion, setOverlayVersion] = useState(() => Date.now());
  const [overlayAvailable, setOverlayAvailable] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const overlayImageSrc = `${getStoryOverlayAssetPath(storyId)}?t=${overlayVersion}`;

  const emit = useChannel({
    [CHANNEL_ANALYSIS_READY]: (payload: AnalysisResult) => {
      setAnalysisState('success');
      setAnalysisMessage('');
      setAnalysisResult(payload);
      setIsAnalysisModalOpen(true);
      setIsTooltipVisible(false);
    },
    [CHANNEL_ANALYSIS_ERROR]: (payload: FigmaSyncErrorPayload) => {
      setAnalysisState('error');
      setAnalysisMessage(payload.message);
      setIsAnalysisModalOpen(false);
    },
    [CHANNEL_OVERLAY_READY]: (payload: OverlayReadyPayload) => {
      setFetchState('success');
      setFetchMessage('Overlay downloaded');
      setOverlayVersion(Date.now());
      setOverlayAvailable(true);
      updateGlobals({
        [FIGMA_URL_KEY]: payload.figmaUrl,
        [OVERLAY_VISIBLE_KEY]: true,
      });
      api.setQueryParams({ [URL_PARAM_OVERLAY_VISIBLE]: '1' });
      setIsTooltipVisible(false);
    },
    [CHANNEL_OVERLAY_ERROR]: (payload: FigmaSyncErrorPayload) => {
      setFetchState('error');
      setFetchMessage(payload.message);
    },
  });

  const [localFigmaUrl, setLocalFigmaUrl] = useState(figmaUrl);

  // Sync local state when global state changes externally
  useEffect(() => {
    setLocalFigmaUrl(figmaUrl);
  }, [figmaUrl]);

  useEffect(() => {
    setOverlayVersion(Date.now());
  }, [storyId]);

  useEffect(() => {
    let isCancelled = false;
    const img = new Image();

    img.onload = () => {
      if (!isCancelled) setOverlayAvailable(true);
    };

    img.onerror = () => {
      if (!isCancelled) setOverlayAvailable(false);
    };

    img.src = overlayImageSrc;

    return () => {
      isCancelled = true;
    };
  }, [overlayImageSrc]);

  useEffect(() => {
    if (overlayAvailable || !showOverlay) return;

    updateGlobals({ [OVERLAY_VISIBLE_KEY]: false });
    api.setQueryParams({ [URL_PARAM_OVERLAY_VISIBLE]: null });
  }, [api, overlayAvailable, showOverlay, updateGlobals]);

  // Resize iframe langsung sesuai ukuran gambar Figma (trigger CSS media queries)
  useEffect(() => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLElement | null;
    if (!iframe) return;

    if (!showOverlay || !overlayImageSrc) {
      iframe.style.width = '';
      iframe.style.height = '';
      return;
    }

    const img = new Image();
    img.onload = () => {
      iframe.style.width = `${img.naturalWidth}px`;
      iframe.style.height = `${img.naturalHeight}px`;
    };
    img.src = overlayImageSrc;

    return () => {
      iframe.style.width = '';
      iframe.style.height = '';
    };
  }, [overlayImageSrc, showOverlay]);

  const handleSubmit = useCallback(() => {
    setFetchState('loading');
    setFetchMessage('Downloading overlay from Figma...');
    updateGlobals({ [FIGMA_URL_KEY]: localFigmaUrl });
    emit(CHANNEL_FETCH_OVERLAY, { figmaUrl: localFigmaUrl, storyId });
  }, [emit, localFigmaUrl, storyId, updateGlobals]);

  const handleVisibleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      updateGlobals({ [OVERLAY_VISIBLE_KEY]: checked });
      api.setQueryParams({
        [URL_PARAM_OVERLAY_VISIBLE]: checked ? '1' : null,
        [URL_PARAM_OVERLAY_OPACITY]: checked ? String(overlayOpacity) : null,
      });
    },
    [api, overlayOpacity, updateGlobals],
  );

  const handleOpacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      updateGlobals({ [OVERLAY_OPACITY_KEY]: value / 100 });
      api.setQueryParams({ [URL_PARAM_OVERLAY_OPACITY]: String(value) });
    },
    [api, updateGlobals],
  );

  const handleAnalyze = useCallback(() => {
    setAnalysisState('loading');
    setAnalysisMessage('Analyzing screenshot against Figma overlay...');
    setAnalysisResult(null);
    const payload: RequestScreenshotPayload = { purpose: 'analyze', storyId };
    emit(CHANNEL_REQUEST_SCREENSHOT, payload);
  }, [emit, storyId]);

  const handleAnalysisModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsAnalysisModalOpen(isOpen);
      if (!isOpen) {
        setAnalysisState('idle');
        setAnalysisMessage('');
        setAnalysisResult(null);
        emit(CHANNEL_DELETE_SCREENSHOT);
      }
    },
    [emit],
  );

  return (
    <>
      <PopoverProvider
        placement="bottom"
        closeOnOutsideClick
        visible={isTooltipVisible}
        onVisibleChange={setIsTooltipVisible}
        aria-label="Figma Sync settings popover"
        popover={() => (
          <div
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '360px',
            }}
          >
            <Field label="Figma URL">
              <div style={{ display: 'flex', gap: '8px' }}>
                <Form.Input
                  id="figma-url-input"
                  type="text"
                  placeholder="https://www.figma.com/file/..."
                  value={localFigmaUrl}
                  onChange={(e) => setLocalFigmaUrl(e.target.value)}
                />
                <Button type="button" onClick={handleSubmit} style={{ height: '100%' }} ariaLabel={false}>
                  Submit
                </Button>
              </div>
            </Field>
            {overlayAvailable ? (
              <Field label={`Overlay: ${showOverlay ? ` ${overlayOpacity}%` : ' Off'}`}>
                <input type="checkbox" checked={showOverlay} onChange={handleVisibleChange} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={overlayOpacity}
                  onChange={handleOpacityChange}
                  disabled={!showOverlay}
                  style={{ flex: 1, width: '100%' }}
                />
              </Field>
            ) : null}
            {fetchMessage ? (
              <div
                style={{
                  fontSize: '12px',
                  color: fetchState === 'error' ? '#d32f2f' : '#666',
                }}
              >
                {fetchMessage}
              </div>
            ) : null}
            {!overlayAvailable && fetchState !== 'loading' ? (
              <div style={{ fontSize: '12px', color: '#666' }}>Overlay PNG belum tersedia untuk story ini.</div>
            ) : null}
            {analysisMessage ? (
              <div
                style={{
                  fontSize: '12px',
                  color: analysisState === 'error' ? '#d32f2f' : '#666',
                }}
              >
                {analysisMessage}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleAnalyze}
              disabled={!overlayAvailable || analysisState === 'loading'}
              style={{
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {analysisState === 'loading' ? 'Menganalisis...' : 'Analisis'}
            </Button>
          </div>
        )}
      >
        <Button
          variant={globals[FIGMA_URL_KEY] ? 'outline' : 'ghost'}
          title="Figma Sync"
          ariaLabel="Figma Sync Settings"
        >
          <LinkIcon />
        </Button>
      </PopoverProvider>
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        result={analysisResult}
        onOpenChange={handleAnalysisModalOpenChange}
      />
    </>
  );
});
