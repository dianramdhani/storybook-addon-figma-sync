import { toPng } from 'html-to-image';
import { createElement } from 'react';
import { addons } from 'storybook/internal/preview-api';
import type {
  PartialStoryFn as StoryFunction,
  ProjectAnnotations,
  Renderer,
  StoryContext,
} from 'storybook/internal/types';

import {
  CHANNEL_ANALYSIS_ERROR,
  CHANNEL_REQUEST_SCREENSHOT,
  CHANNEL_SAVE_SCREENSHOT,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  getStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VISIBLE_KEY,
  type RequestScreenshotPayload,
  type SaveScreenshotPayload,
  URL_PARAM_OVERLAY_OPACITY,
  URL_PARAM_OVERLAY_VISIBLE,
} from './constants';

function getInitialGlobalsFromUrl(): Record<string, unknown> {
  const params = new URLSearchParams(window.location.search);
  const updates: Record<string, unknown> = {};
  const visibleParam = params.get(URL_PARAM_OVERLAY_VISIBLE);
  const opacityParam = params.get(URL_PARAM_OVERLAY_OPACITY);
  if (visibleParam !== null) updates[OVERLAY_VISIBLE_KEY] = visibleParam === '1';
  if (opacityParam !== null) {
    const parsed = parseFloat(opacityParam);
    if (!isNaN(parsed)) updates[OVERLAY_OPACITY_KEY] = parsed / 100;
  }
  return updates;
}

const urlGlobals = getInitialGlobalsFromUrl();
async function getOverlayDimensions(storyId?: string | null) {
  if (!storyId) return null;

  const overlaySrc = getStoryOverlayAssetPath(storyId);

  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = `${overlaySrc}?t=${Date.now()}`;
  });
}

const channel = addons.getChannel();
channel.on(CHANNEL_REQUEST_SCREENSHOT, async (payload?: RequestScreenshotPayload) => {
  if (typeof document === 'undefined') return;

  const element = document.getElementById('storybook-root') || document.body;

  try {
    const overlayDimensions = await getOverlayDimensions(payload?.storyId);
    const width = overlayDimensions?.width ?? window.innerWidth;
    const height = overlayDimensions?.height ?? window.innerHeight;
    const dataUrl = await toPng(element, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      skipAutoScale: true,
      filter: (node) => {
        if (node instanceof HTMLElement && node.getAttribute('data-figma-sync-ignore') === 'true') return false;
        return true;
      },
      cacheBust: true,
    });
    const screenshotPayload: SaveScreenshotPayload = {
      image: dataUrl,
      purpose: payload?.purpose ?? 'capture',
      storyId: payload?.storyId ?? null,
    };
    channel.emit(CHANNEL_SAVE_SCREENSHOT, screenshotPayload);
  } catch (error) {
    console.error('[Figma Sync] Failed to take screenshot:', error);
    if (payload?.purpose === 'analyze') {
      const errorPayload: FigmaSyncErrorPayload = {
        message: error instanceof Error ? error.message : 'Failed to capture screenshot for analysis',
      };
      channel.emit(CHANNEL_ANALYSIS_ERROR, errorPayload);
    }
  }
});

const withOverlay = (StoryFn: StoryFunction<Renderer>, context: StoryContext<Renderer>) => {
  const overlaySrc = getStoryOverlayAssetPath(context.id);
  const isVisible = Boolean(context.globals[OVERLAY_VISIBLE_KEY]);
  const overlayOpacity = (context.globals[OVERLAY_OPACITY_KEY] as number | undefined) ?? 0.5;

  if (!overlaySrc || !isVisible) return StoryFn();

  return createElement(
    'div',
    { style: { position: 'relative' } },
    StoryFn(),
    createElement('img', {
      src: overlaySrc,
      alt: '',
      'aria-hidden': true,
      'data-figma-sync-ignore': 'true',
      style: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: overlayOpacity,
      },
    }),
  );
};

const preview: ProjectAnnotations<Renderer> = {
  globalTypes: {
    [FIGMA_URL_KEY]: {
      name: 'Figma URL',
      description: 'Shared Figma file URL for the addon panel',
      defaultValue: '',
    },
    [OVERLAY_VISIBLE_KEY]: {
      name: 'Overlay visible',
      description: 'Show or hide the overlay image',
      defaultValue: false,
    },
    [OVERLAY_OPACITY_KEY]: {
      name: 'Overlay opacity',
      description: 'Opacity of the overlay image',
      defaultValue: 0.5,
    },
  },
  initialGlobals: {
    [FIGMA_URL_KEY]: '',
    [OVERLAY_VISIBLE_KEY]: false,
    [OVERLAY_OPACITY_KEY]: 0.5,
    ...urlGlobals,
  },
  decorators: [withOverlay],
};

export default preview;
