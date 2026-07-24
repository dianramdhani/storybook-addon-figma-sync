import React, { memo, useCallback, useEffect, useState } from 'react';
import { useChannel, useStorybookApi } from 'storybook/manager-api';
import { styled } from 'storybook/theming';

import {
  CHANNEL_COMPONENT_PREVIEW_ERROR,
  CHANNEL_COMPONENT_PREVIEW_READY,
  CHANNEL_COMPONENTS_ERROR,
  CHANNEL_COMPONENTS_READY,
  CHANNEL_DISCOVER_COMPONENTS,
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_PREVIEW_COMPONENT,
  type ComponentPreviewErrorPayload,
  type ComponentPreviewReadyPayload,
  type ComponentsErrorPayload,
  type ComponentsReadyPayload,
  type DiscoveredFigmaComponent,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  OVERLAY_VERSION_KEY,
  OVERLAY_VISIBLE_KEY,
  type OverlayReadyPayload,
} from '../../constants';
import { getFigmaEmbedUrl, isValidFigmaDesignUrl } from '../../lib/figma-url';
import { FigmaComponentDiscovery } from './FigmaComponentDiscovery';
import { FigmaEmbedForm } from './FigmaEmbedForm';
import { FigmaEmbedFrame } from './FigmaEmbedFrame';

const PanelContainer = styled.div({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
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
  const [discoveryState, setDiscoveryState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [components, setComponents] = useState<ComponentsReadyPayload['components']>([]);
  const [discoveryMessage, setDiscoveryMessage] = useState('');
  const [isComponentsDrawerOpen, setIsComponentsDrawerOpen] = useState(false);
  const [componentPreviewUrls, setComponentPreviewUrls] = useState<Record<string, string>>({});
  const [componentPreviewErrors, setComponentPreviewErrors] = useState<Record<string, string>>({});
  const [previewingComponentId, setPreviewingComponentId] = useState<string | null>(null);

  const emit = useChannel({
    [CHANNEL_OVERLAY_READY]: (payload: OverlayReadyPayload) => {
      if (payload.figmaUrl !== figmaUrl) {
        setDiscoveryState('idle');
        setComponents([]);
        setDiscoveryMessage('');
        setIsComponentsDrawerOpen(false);
        setComponentPreviewUrls({});
        setComponentPreviewErrors({});
        setPreviewingComponentId(null);
      }
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
    [CHANNEL_COMPONENTS_READY]: (payload: ComponentsReadyPayload) => {
      if (payload.storyId !== api.getCurrentStoryData()?.id) return;
      setDiscoveryState('success');
      setDiscoveryMessage('');
      setComponents(payload.components);
    },
    [CHANNEL_COMPONENTS_ERROR]: (payload: ComponentsErrorPayload) => {
      if (payload.storyId !== api.getCurrentStoryData()?.id) return;
      setDiscoveryState('error');
      setDiscoveryMessage(payload.message);
    },
    [CHANNEL_COMPONENT_PREVIEW_READY]: (payload: ComponentPreviewReadyPayload) => {
      if (payload.storyId !== api.getCurrentStoryData()?.id) return;
      setComponentPreviewUrls((urls) => ({ ...urls, [payload.componentId]: payload.previewUrl }));
      setPreviewingComponentId(null);
    },
    [CHANNEL_COMPONENT_PREVIEW_ERROR]: (payload: ComponentPreviewErrorPayload) => {
      if (payload.storyId !== api.getCurrentStoryData()?.id) return;
      setComponentPreviewErrors((errors) => ({ ...errors, [payload.componentId]: payload.message }));
      setPreviewingComponentId(null);
    },
  });

  useEffect(() => {
    if (!storyId) {
      setFigmaUrl('');
      setFormInputUrl('');
      setDiscoveryState('idle');
      setComponents([]);
      setDiscoveryMessage('');
      setIsComponentsDrawerOpen(false);
      setComponentPreviewUrls({});
      setComponentPreviewErrors({});
      setPreviewingComponentId(null);
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
          if (Array.isArray(entry.components)) {
            setComponents(entry.components);
            setDiscoveryState('success');
          } else {
            setDiscoveryState('idle');
            setComponents([]);
          }
        } else {
          setFigmaUrl('');
          setFormInputUrl('');
          setDiscoveryState('idle');
          setComponents([]);
        }
        setDiscoveryMessage('');
        setIsComponentsDrawerOpen(false);
        setComponentPreviewUrls({});
        setComponentPreviewErrors({});
        setPreviewingComponentId(null);
      })
      .catch(() => {
        setFigmaUrl('');
        setFormInputUrl('');
        setDiscoveryState('idle');
        setComponents([]);
        setDiscoveryMessage('');
        setIsComponentsDrawerOpen(false);
        setComponentPreviewUrls({});
        setComponentPreviewErrors({});
        setPreviewingComponentId(null);
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

  const handleInspect = useCallback(() => {
    if (!isValidFigmaDesignUrl(figmaUrl)) return;
    setDiscoveryState('loading');
    setDiscoveryMessage('');
    emit(CHANNEL_DISCOVER_COMPONENTS, { figmaUrl, storyId });
  }, [emit, figmaUrl, storyId]);

  const handleComponentsToggle = useCallback(() => {
    if (isComponentsDrawerOpen) {
      setIsComponentsDrawerOpen(false);
      return;
    }

    setIsComponentsDrawerOpen(true);
    if (discoveryState === 'idle') handleInspect();
  }, [discoveryState, handleInspect, isComponentsDrawerOpen]);

  const handlePreview = useCallback(
    (component: DiscoveredFigmaComponent) => {
      if (!component.figmaUrl || componentPreviewUrls[component.componentId]) return;
      setPreviewingComponentId(component.componentId);
      setComponentPreviewErrors((errors) => {
        const remaining = { ...errors };
        delete remaining[component.componentId];
        return remaining;
      });
      emit(CHANNEL_PREVIEW_COMPONENT, { componentId: component.componentId, figmaUrl: component.figmaUrl, storyId });
    },
    [componentPreviewUrls, emit, storyId],
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
        <>
          <FigmaEmbedFrame
            embedUrl={getFigmaEmbedUrl(figmaUrl)}
            figmaUrl={figmaUrl}
            title={`Figma embed for story ${storyId}`}
            componentsOpen={isComponentsDrawerOpen}
            onComponentsClick={handleComponentsToggle}
          />
          {isComponentsDrawerOpen && (
            <FigmaComponentDiscovery
              components={components}
              state={discoveryState}
              message={discoveryMessage}
              previewUrls={componentPreviewUrls}
              previewErrors={componentPreviewErrors}
              previewingComponentId={previewingComponentId}
              onInspect={handleInspect}
              onPreview={handlePreview}
              onClose={() => setIsComponentsDrawerOpen(false)}
            />
          )}
        </>
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
