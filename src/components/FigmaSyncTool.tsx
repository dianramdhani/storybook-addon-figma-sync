import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, WithTooltip } from 'storybook/internal/components';
import { useChannel, useGlobals, useParameter, useStorybookApi } from 'storybook/manager-api';

import { FIGMA_URL_KEY, OVERLAY_OPACITY_KEY, OVERLAY_VISIBLE_KEY } from '../constants';

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
  const emit = useChannel({});
  const figmaOverlaySrc = useParameter<string | undefined>('figmaOverlaySrc');

  const figmaUrl = (globals[FIGMA_URL_KEY] as string) || '';
  const showOverlay = Boolean(globals[OVERLAY_VISIBLE_KEY]);
  const overlayOpacity = Math.round(((globals[OVERLAY_OPACITY_KEY] as number | undefined) ?? 0.5) * 100);

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

    if (!showOverlay || !figmaOverlaySrc) {
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
    img.src = figmaOverlaySrc;
  }, [showOverlay, figmaOverlaySrc]);

  const handleSubmit = useCallback(() => {
    updateGlobals({ [FIGMA_URL_KEY]: localFigmaUrl });
    emit('figma-sync/request-screenshot');
  }, [localFigmaUrl, updateGlobals, emit]);

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
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnOutsideClick
      aria-label="Figma Sync settings popover"
      tooltip={() => (
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
        </div>
      )}
    >
      <Button variant={globals[FIGMA_URL_KEY] ? 'outline' : 'ghost'} title="Figma Sync" ariaLabel="Figma Sync Settings">
        <LinkIcon />
      </Button>
    </WithTooltip>
  );
});
