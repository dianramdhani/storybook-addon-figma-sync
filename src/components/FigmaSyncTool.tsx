import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect } from 'react';
import { Button, Form, IconButton, WithTooltip } from 'storybook/internal/components';
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
    updateGlobals({ [FIGMA_URL_KEY]: figmaUrl });
    emit('figma-sync/request-screenshot');
  }, [figmaUrl, updateGlobals, emit]);

  const handleVisibleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      updateGlobals({ [OVERLAY_VISIBLE_KEY]: checked });
      api.setQueryParams({
        figmaOverlayVisible: checked ? '1' : null,
        figmaOverlayOpacity: checked ? String(overlayOpacity) : null,
      });
    },
    [updateGlobals, api, overlayOpacity],
  );

  const handleOpacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value) / 100;
      updateGlobals({ [OVERLAY_OPACITY_KEY]: value });
      api.setQueryParams({ figmaOverlayOpacity: String(Math.round(value * 100)) });
    },
    [updateGlobals, api],
  );

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnOutsideClick
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
                value={figmaUrl}
                onChange={(e) => updateGlobals({ [FIGMA_URL_KEY]: e.target.value })}
              />
              <Button type="button" onClick={handleSubmit} style={{ height: '100%' }}>
                Submit
              </Button>
            </div>
          </Field>
          <Field label={`Overlay: ${showOverlay ? ` ${Math.round(overlayOpacity)}%` : ' Off'}`}>
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
        </div>
      )}
    >
      <IconButton variant="ghost" title="Figma Sync" active={!!globals[FIGMA_URL_KEY]}>
        <LinkIcon />
      </IconButton>
    </WithTooltip>
  );
});
