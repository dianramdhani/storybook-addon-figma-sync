import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, PopoverProvider } from 'storybook/internal/components';
import { useChannel, useGlobals, useStorybookApi } from 'storybook/manager-api';

import {
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_REQUEST_SCREENSHOT,
  FIGMA_URL_KEY,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VISIBLE_KEY,
} from '../constants';

function getStoryOverlaySrc(storyId: string) {
  return `/figma-sync-assets/figma-${storyId}.png`;
}

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
  const overlayImageSrc = `${getStoryOverlaySrc(storyId)}?t=${overlayVersion}`;

  const emit = useChannel({
    [CHANNEL_OVERLAY_READY]: (payload: { figmaUrl: string }) => {
      setFetchState('success');
      setFetchMessage('Overlay downloaded');
      setOverlayVersion(Date.now());
      setOverlayAvailable(true);
      updateGlobals({
        [FIGMA_URL_KEY]: payload.figmaUrl,
        [OVERLAY_VISIBLE_KEY]: true,
      });
      api.setQueryParams({ figmaOverlayVisible: '1' });
      setIsTooltipVisible(false);
    },
    [CHANNEL_OVERLAY_ERROR]: (payload: { message: string }) => {
      setFetchState('error');
      setFetchMessage(payload.message);
    },
  });

  const [localFigmaUrl, setLocalFigmaUrl] = useState(figmaUrl);
  const [localShowOverlay, setLocalShowOverlay] = useState(showOverlay);
  const [localOverlayOpacity, setLocalOverlayOpacity] = useState(overlayOpacity);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when global state changes externally
  useEffect(() => {
    setLocalFigmaUrl(figmaUrl);
  }, [figmaUrl]);

  useEffect(() => {
    setLocalShowOverlay(showOverlay);
  }, [showOverlay]);

  useEffect(() => {
    setLocalOverlayOpacity(overlayOpacity);
  }, [overlayOpacity]);

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

    setLocalShowOverlay(false);
    updateGlobals({ [OVERLAY_VISIBLE_KEY]: false });
    api.setQueryParams({ figmaOverlayVisible: null });
  }, [api, overlayAvailable, showOverlay, updateGlobals]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateGlobalsDebounced = useCallback(
    (value: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateGlobals({ [OVERLAY_OPACITY_KEY]: value });
        api.setQueryParams({ figmaOverlayOpacity: String(Math.round(value * 100)) });
      }, 150);
    },
    [updateGlobals, api],
  );

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
      console.log('Figma overlay image loaded:', img.naturalWidth, img.naturalHeight);
    };
    img.src = overlayImageSrc;
  }, [overlayImageSrc, showOverlay]);

  const handleSubmit = useCallback(() => {
    setFetchState('loading');
    setFetchMessage('Downloading overlay from Figma...');
    updateGlobals({ [FIGMA_URL_KEY]: localFigmaUrl });
    emit(CHANNEL_FETCH_OVERLAY, { figmaUrl: localFigmaUrl, storyId });
    emit(CHANNEL_REQUEST_SCREENSHOT);
  }, [emit, localFigmaUrl, storyId, updateGlobals]);

  const handleVisibleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setLocalShowOverlay(checked);
      updateGlobals({ [OVERLAY_VISIBLE_KEY]: checked });
      api.setQueryParams({
        figmaOverlayVisible: checked ? '1' : null,
        figmaOverlayOpacity: checked ? String(localOverlayOpacity) : null,
      });
    },
    [updateGlobals, api, localOverlayOpacity],
  );

  const handleOpacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setLocalOverlayOpacity(value);
      updateGlobalsDebounced(value / 100);
    },
    [updateGlobalsDebounced],
  );

  return (
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
            <Field label={`Overlay: ${localShowOverlay ? ` ${Math.round(localOverlayOpacity)}%` : ' Off'}`}>
              <input type="checkbox" checked={localShowOverlay} onChange={handleVisibleChange} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={localOverlayOpacity}
                onChange={handleOpacityChange}
                disabled={!localShowOverlay}
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
        </div>
      )}
    >
      <Button variant={globals[FIGMA_URL_KEY] ? 'outline' : 'ghost'} title="Figma Sync" ariaLabel="Figma Sync Settings">
        <LinkIcon />
      </Button>
    </PopoverProvider>
  );
});
