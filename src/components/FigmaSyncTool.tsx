import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  getFigmaUrlGlobal,
  getOverlayOpacityGlobal,
  getOverlayVisibleGlobal,
  getVersionedStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VERSION_KEY,
  OVERLAY_VISIBLE_KEY,
  type OverlayReadyPayload,
  type RequestScreenshotPayload,
  URL_PARAM_OVERLAY_OPACITY,
  URL_PARAM_OVERLAY_VISIBLE,
} from '../constants';
import { AnalysisModal } from './AnalysisModal';
import { useOverlayAvailability, useOverlayIframeSizing } from './useOverlayImage';

const Field = memo(function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600 }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>{children}</div>
    </div>
  );
});

const PopoverContent = memo(function PopoverContent({
  localFigmaUrl,
  onLocalUrlChange,
  onSubmit,
  overlayAvailable,
  showOverlay,
  overlayOpacity,
  onVisibleChange,
  onOpacityChange,
  fetchMessage,
  fetchState,
  analysisMessage,
  analysisState,
  onAnalyze,
  isLoading,
}: {
  localFigmaUrl: string;
  onLocalUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  overlayAvailable: boolean;
  showOverlay: boolean;
  overlayOpacity: number;
  onVisibleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpacityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchMessage: string;
  fetchState: 'idle' | 'loading' | 'success' | 'error';
  analysisMessage: string;
  analysisState: 'idle' | 'loading' | 'success' | 'error';
  onAnalyze: () => void;
  isLoading: boolean;
}) {
  const showFetchMessage = fetchMessage && fetchState !== 'success';
  const showInfoMessage = !overlayAvailable && fetchState !== 'loading';

  return (
    <div
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '360px',
      }}
    >
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #c9cccf !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
        }
      `}</style>
      <Field label="Figma URL">
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <Form.Input
            id="figma-url-input"
            type="text"
            placeholder="https://www.figma.com/file/..."
            value={localFigmaUrl}
            onChange={onLocalUrlChange}
            aria-label="Figma URL input"
          />
          <Button
            type="button"
            onClick={onSubmit}
            ariaLabel="Submit Figma URL"
            style={{ height: '100%', backgroundColor: '#006dea', color: '#ffffff' }}
          >
            Submit
          </Button>
        </div>
      </Field>

      {overlayAvailable && (
        <Field label={`Overlay: ${showOverlay ? ` ${overlayOpacity}%` : ' Off'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={onVisibleChange}
              aria-label="Toggle overlay visibility"
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={overlayOpacity}
              onChange={onOpacityChange}
              disabled={!showOverlay}
              style={{ flex: 1, width: '100%' }}
              aria-label="Overlay opacity slider"
            />
          </div>
        </Field>
      )}

      {showFetchMessage && (
        <div
          style={{
            fontSize: '12px',
            color: fetchState === 'error' ? '#d32f2f' : '#666',
          }}
          role="status"
          aria-live="polite"
        >
          {fetchMessage}
        </div>
      )}

      {showInfoMessage && (
        <div style={{ fontSize: '12px', color: '#666' }}>Overlay PNG belum tersedia untuk story ini.</div>
      )}

      {analysisMessage && (
        <div
          style={{
            fontSize: '12px',
            color: analysisState === 'error' ? '#d32f2f' : '#666',
          }}
          role="status"
          aria-live="polite"
        >
          {analysisMessage}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onAnalyze}
        disabled={!overlayAvailable || isLoading}
        style={{ width: '100%', backgroundColor: '#006dea', color: '#ffffff' }}
        ariaLabel="Analyze screenshot against Figma overlay"
      >
        {isLoading ? 'Please wait...' : 'Analyze Screenshot'}
      </Button>
    </div>
  );
});

export const FigmaSyncTool = memo(function FigmaSyncTool() {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const storyId = api.getCurrentStoryData()?.id ?? '';

  const figmaUrl = getFigmaUrlGlobal(globals);
  const showOverlay = getOverlayVisibleGlobal(globals);
  const globalOverlayOpacity = getOverlayOpacityGlobal(globals);
  const overlayOpacityPercent = Math.round(globalOverlayOpacity * 100);

  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchMessage, setFetchMessage] = useState('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [overlayVersion, setOverlayVersion] = useState(() => Date.now());
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [localFigmaUrl, setLocalFigmaUrl] = useState(figmaUrl);

  // Internal state untuk opacity biar smooth
  const [localOpacity, setLocalOpacity] = useState(overlayOpacityPercent);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const overlayImageSrc = getVersionedStoryOverlayAssetPath(storyId, overlayVersion);
  const overlayAvailable = useOverlayAvailability(overlayImageSrc);

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
      const version = Date.now();
      setFetchState('success');
      setFetchMessage('Overlay downloaded');
      setOverlayVersion(version);
      updateGlobals({
        [FIGMA_URL_KEY]: payload.figmaUrl,
        [OVERLAY_VISIBLE_KEY]: true,
        [OVERLAY_VERSION_KEY]: version,
      });
      api.setQueryParams({ [URL_PARAM_OVERLAY_VISIBLE]: '1' });
      setIsTooltipVisible(false);
    },
    [CHANNEL_OVERLAY_ERROR]: (payload: FigmaSyncErrorPayload) => {
      setFetchState('error');
      setFetchMessage(payload.message);
    },
  });

  useEffect(() => {
    setLocalFigmaUrl(figmaUrl);
  }, [figmaUrl]);

  useEffect(() => {
    setLocalOpacity(overlayOpacityPercent);
  }, [overlayOpacityPercent]);

  useEffect(() => {
    setOverlayVersion(Date.now());
  }, [storyId]);

  useEffect(() => {
    if (overlayAvailable || !showOverlay) return;
    updateGlobals({ [OVERLAY_VISIBLE_KEY]: false });
    api.setQueryParams({ [URL_PARAM_OVERLAY_VISIBLE]: null });
  }, [api, overlayAvailable, showOverlay, updateGlobals]);

  useOverlayIframeSizing(overlayImageSrc, showOverlay);

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
        [URL_PARAM_OVERLAY_OPACITY]: checked ? String(localOpacity) : null,
      });
    },
    [api, localOpacity, updateGlobals],
  );

  const handleOpacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);

      // Update internal state immediately untuk UI yang smooth
      setLocalOpacity(value);

      // Debounce update ke global state
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const opacityValue = value / 100;
        updateGlobals({ [OVERLAY_OPACITY_KEY]: opacityValue });
        api.setQueryParams({ [URL_PARAM_OVERLAY_OPACITY]: String(value) });
        debounceTimerRef.current = null;
      }, 100); // Debounce 100ms
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

  const handleLocalUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFigmaUrl(e.target.value);
  }, []);

  const handleTooltipVisibleChange = useCallback((visible: boolean) => {
    setIsTooltipVisible(visible);
  }, []);

  const isAnalyzeLoading = analysisState === 'loading';

  const buttonVariant = useMemo(() => {
    return globals[FIGMA_URL_KEY] ? 'outline' : 'ghost';
  }, [globals]);

  return (
    <>
      <PopoverProvider
        placement="bottom"
        visible={isTooltipVisible}
        onVisibleChange={handleTooltipVisibleChange}
        aria-label="Figma Sync settings popover"
        popover={() => (
          <PopoverContent
            localFigmaUrl={localFigmaUrl}
            onLocalUrlChange={handleLocalUrlChange}
            onSubmit={handleSubmit}
            overlayAvailable={overlayAvailable}
            showOverlay={showOverlay}
            overlayOpacity={localOpacity}
            onVisibleChange={handleVisibleChange}
            onOpacityChange={handleOpacityChange}
            fetchMessage={fetchMessage}
            fetchState={fetchState}
            analysisMessage={analysisMessage}
            analysisState={analysisState}
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzeLoading}
          />
        )}
      >
        <Button variant={buttonVariant} title="Figma Sync" ariaLabel="Figma Sync Settings">
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
