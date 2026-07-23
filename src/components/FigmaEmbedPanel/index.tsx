import React, { memo, useCallback, useEffect, useState } from 'react';
import { useChannel, useStorybookApi } from 'storybook/manager-api';
import { styled } from 'storybook/theming';

import {
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  OVERLAY_VERSION_KEY,
  OVERLAY_VISIBLE_KEY,
  type OverlayReadyPayload,
} from '../../constants';
import { getFigmaEmbedUrl, isValidFigmaDesignUrl } from '../../lib/figma-url';
import { FigmaEmbedForm } from './FigmaEmbedForm';
import { FigmaEmbedFrame } from './FigmaEmbedFrame';

const PanelContainer = styled.div({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
});

const StatusText = styled.div({
  padding: '16px',
  fontSize: '13px',
  color: '#666',
});

export interface FigmaEmbedPanelProps {
  active?: boolean;
}

export const FigmaEmbedPanel = memo(function FigmaEmbedPanel({ active = true }: FigmaEmbedPanelProps) {
  const api = useStorybookApi();
  const storyData = api.getCurrentStoryData();
  const storyId = storyData?.id ?? '';
  const viewMode = api.getUrlState()?.viewMode ?? 'story';

  const [figmaUrl, setFigmaUrl] = useState('');
  const [formInputUrl, setFormInputUrl] = useState('');
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchMessage, setFetchMessage] = useState('');
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);

  const emit = useChannel({
    [CHANNEL_OVERLAY_READY]: (payload: OverlayReadyPayload) => {
      setFetchState('success');
      setFetchMessage('');
      setFigmaUrl(payload.figmaUrl);
      setFormInputUrl(payload.figmaUrl);

      api.setGlobals({
        [FIGMA_URL_KEY]: payload.figmaUrl,
        [OVERLAY_VISIBLE_KEY]: true,
        [OVERLAY_VERSION_KEY]: Date.now(),
      });
    },
    [CHANNEL_OVERLAY_ERROR]: (payload: FigmaSyncErrorPayload) => {
      setFetchState('error');
      setFetchMessage(payload.message);
    },
  });

  useEffect(() => {
    if (!storyId) {
      setFigmaUrl('');
      setFormInputUrl('');
      return;
    }

    setIsLoadingRegistry(true);
    fetch('/figma-sync-assets/registry.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .then((registry) => {
        const entry = registry[storyId];
        if (entry && entry.figmaUrl && isValidFigmaDesignUrl(entry.figmaUrl)) {
          setFigmaUrl(entry.figmaUrl);
          setFormInputUrl(entry.figmaUrl);
        } else {
          setFigmaUrl('');
          setFormInputUrl('');
        }
      })
      .catch(() => {
        setFigmaUrl('');
        setFormInputUrl('');
      })
      .finally(() => {
        setIsLoadingRegistry(false);
      });
  }, [storyId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormInputUrl(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValidFigmaDesignUrl(formInputUrl)) {
        setFetchState('error');
        setFetchMessage('URL Figma tidak valid. Pastikan URL menggunakan HTTPS figma.com dengan node-id.');
        return;
      }

      setFetchState('loading');
      setFetchMessage('Downloading overlay from Figma...');
      emit(CHANNEL_FETCH_OVERLAY, { figmaUrl: formInputUrl, storyId });
    },
    [emit, formInputUrl, storyId],
  );

  // Requirement 1.2: Do not render iframe when active view is not story or storyId is empty
  if (!active || viewMode !== 'story' || !storyId) {
    return null;
  }

  if (isLoadingRegistry) {
    return (
      <PanelContainer>
        <StatusText role="status" aria-live="polite">
          Loading Figma embed info...
        </StatusText>
      </PanelContainer>
    );
  }

  const hasValidUrl = isValidFigmaDesignUrl(figmaUrl);

  return (
    <PanelContainer>
      {hasValidUrl ? (
        <FigmaEmbedFrame
          embedUrl={getFigmaEmbedUrl(figmaUrl)}
          figmaUrl={figmaUrl}
          title={`Figma embed for story ${storyId}`}
        />
      ) : (
        <FigmaEmbedForm
          figmaUrl={formInputUrl}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          fetchState={fetchState}
          fetchMessage={fetchMessage}
        />
      )}
    </PanelContainer>
  );
});
