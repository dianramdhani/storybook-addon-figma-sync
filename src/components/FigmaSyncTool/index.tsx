import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, PopoverProvider } from 'storybook/internal/components';
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
  CHANNEL_SAVE_SETTINGS,
  DEFAULT_OVERLAY_OPACITY,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  getOverlayOpacityGlobal,
  getOverlayVisibleGlobal,
  getVersionedStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VERSION_KEY,
  OVERLAY_VISIBLE_KEY,
  type OverlayReadyPayload,
  type RequestScreenshotPayload,
  type SaveSettingsPayload,
  URL_PARAM_OVERLAY_OPACITY,
  URL_PARAM_OVERLAY_VISIBLE,
} from '../../constants';
import { isValidFigmaDesignUrl } from '../../lib/figma-url';
import { AnalysisModal } from '../AnalysisModal';
import { useOverlayAvailability, useOverlayIframeSizing } from '../useOverlayImage';
import { PopoverContent } from './PopoverContent';

export const FigmaSyncTool = memo(function FigmaSyncTool() {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();
  const storyId = api.getCurrentStoryData()?.id ?? '';

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
  const [localFigmaUrl, setLocalFigmaUrl] = useState('');

  // Internal state untuk opacity biar smooth
  const [localOpacity, setLocalOpacity] = useState(overlayOpacityPercent);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const overlayImageSrc = getVersionedStoryOverlayAssetPath(storyId, overlayVersion);
  const overlayStatus = useOverlayAvailability(overlayImageSrc);
  const overlayAvailable = overlayStatus === 'available';

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
    if (!storyId) return;

    fetch('/figma-sync-assets/registry.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .then((registry) => {
        const entry = registry[storyId];
        if (entry && entry.figmaUrl) {
          setLocalFigmaUrl(entry.figmaUrl);
          const savedOpacity =
            entry.overlayOpacity !== undefined ? Math.round(entry.overlayOpacity * 100) : DEFAULT_OVERLAY_OPACITY * 100;
          const savedVisible = entry.overlayVisible ?? false;
          setLocalOpacity(savedOpacity);
          updateGlobals({
            [FIGMA_URL_KEY]: entry.figmaUrl,
            [OVERLAY_VISIBLE_KEY]: savedVisible,
            [OVERLAY_OPACITY_KEY]: entry.overlayOpacity ?? DEFAULT_OVERLAY_OPACITY,
          });
          api.setQueryParams({
            [URL_PARAM_OVERLAY_VISIBLE]: savedVisible ? '1' : null,
            [URL_PARAM_OVERLAY_OPACITY]: savedVisible ? String(savedOpacity) : null,
          });
        } else {
          setLocalFigmaUrl('');
          updateGlobals({
            [FIGMA_URL_KEY]: '',
            [OVERLAY_VISIBLE_KEY]: false,
            [OVERLAY_OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
          });
          api.setQueryParams({
            [URL_PARAM_OVERLAY_VISIBLE]: null,
            [URL_PARAM_OVERLAY_OPACITY]: null,
          });
        }
      })
      .catch(() => {
        setLocalFigmaUrl('');
        updateGlobals({
          [FIGMA_URL_KEY]: '',
          [OVERLAY_VISIBLE_KEY]: false,
          [OVERLAY_OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
        });
        api.setQueryParams({
          [URL_PARAM_OVERLAY_VISIBLE]: null,
          [URL_PARAM_OVERLAY_OPACITY]: null,
        });
      });
  }, [storyId, updateGlobals, api]);

  useEffect(() => {
    setLocalOpacity(overlayOpacityPercent);
  }, [overlayOpacityPercent]);

  useEffect(() => {
    setOverlayVersion(Date.now());
  }, [storyId]);

  useEffect(() => {
    if (overlayStatus !== 'unavailable' || !showOverlay) return;
    updateGlobals({ [OVERLAY_VISIBLE_KEY]: false });
    api.setQueryParams({ [URL_PARAM_OVERLAY_VISIBLE]: null });
  }, [api, overlayStatus, showOverlay, updateGlobals]);

  useOverlayIframeSizing(overlayImageSrc, showOverlay);

  const handleSubmit = useCallback(() => {
    if (!isValidFigmaDesignUrl(localFigmaUrl)) {
      setFetchState('error');
      setFetchMessage('URL Figma tidak valid. Pastikan URL menggunakan HTTPS figma.com dengan node-id.');
      return;
    }
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

      const settingsPayload: SaveSettingsPayload = {
        storyId,
        overlayVisible: checked,
        overlayOpacity: localOpacity / 100,
      };
      emit(CHANNEL_SAVE_SETTINGS, settingsPayload);
    },
    [api, emit, localOpacity, storyId, updateGlobals],
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

        const settingsPayload: SaveSettingsPayload = {
          storyId,
          overlayVisible: showOverlay,
          overlayOpacity: opacityValue,
        };
        emit(CHANNEL_SAVE_SETTINGS, settingsPayload);

        debounceTimerRef.current = null;
      }, 100); // Debounce 100ms
    },
    [api, emit, showOverlay, storyId, updateGlobals],
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
        emit(CHANNEL_DELETE_SCREENSHOT, { storyId });
      }
    },
    [emit, storyId],
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
    <React.Fragment key={storyId}>
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
    </React.Fragment>
  );
});
