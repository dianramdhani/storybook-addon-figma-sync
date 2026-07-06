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
  DEFAULT_FIGMA_URL,
  DEFAULT_OVERLAY_OPACITY,
  DEFAULT_OVERLAY_VERSION,
  DEFAULT_OVERLAY_VISIBLE,
  FIGMA_URL_KEY,
  type FigmaSyncErrorPayload,
  getOverlayOpacityGlobal,
  getOverlayVersionGlobal,
  getOverlayVisibleGlobal,
  getVersionedStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VERSION_KEY,
  OVERLAY_VISIBLE_KEY,
  type RequestScreenshotPayload,
} from './constants';
import {
  createScreenshotPayload,
  getCaptureDimensions,
  getInitialGlobalsFromUrl,
  getOverlayDimensions,
} from './lib/figma-sync-preview';

const urlGlobals = getInitialGlobalsFromUrl();

const channel = addons.getChannel();
channel.on(CHANNEL_REQUEST_SCREENSHOT, async (payload?: RequestScreenshotPayload) => {
  if (typeof document === 'undefined') return;

  const element = document.getElementById('storybook-root') || document.body;

  try {
    const overlayDimensions = await getOverlayDimensions(payload?.storyId);
    const { width, height } = getCaptureDimensions(overlayDimensions);
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
    const screenshotPayload = createScreenshotPayload(dataUrl, payload);
    channel.emit(CHANNEL_SAVE_SCREENSHOT, screenshotPayload);
  } catch (error) {
    console.error('[Figma Sync] Failed to take screenshot:', error);
    if (payload?.purpose === 'analyze' || payload?.requestId) {
      const errorPayload: FigmaSyncErrorPayload = {
        message: error instanceof Error ? error.message : 'Failed to capture screenshot for analysis',
        requestId: payload?.requestId,
      };
      channel.emit(CHANNEL_ANALYSIS_ERROR, errorPayload);
    }
  }
});

const withOverlay = (StoryFn: StoryFunction<Renderer>, context: StoryContext<Renderer>) => {
  const isVisible = getOverlayVisibleGlobal(context.globals);
  const overlayOpacity = getOverlayOpacityGlobal(context.globals);
  const overlayVersion = getOverlayVersionGlobal(context.globals);
  const overlaySrc = getVersionedStoryOverlayAssetPath(context.id, overlayVersion);

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
      defaultValue: DEFAULT_FIGMA_URL,
    },
    [OVERLAY_VISIBLE_KEY]: {
      name: 'Overlay visible',
      description: 'Show or hide the overlay image',
      defaultValue: DEFAULT_OVERLAY_VISIBLE,
    },
    [OVERLAY_OPACITY_KEY]: {
      name: 'Overlay opacity',
      description: 'Opacity of the overlay image',
      defaultValue: DEFAULT_OVERLAY_OPACITY,
    },
    [OVERLAY_VERSION_KEY]: {
      name: 'Overlay version',
      description: 'Timestamp to bust the cache of overlay image',
      defaultValue: DEFAULT_OVERLAY_VERSION,
    },
  },
  initialGlobals: {
    [FIGMA_URL_KEY]: DEFAULT_FIGMA_URL,
    [OVERLAY_VISIBLE_KEY]: DEFAULT_OVERLAY_VISIBLE,
    [OVERLAY_OPACITY_KEY]: DEFAULT_OVERLAY_OPACITY,
    [OVERLAY_VERSION_KEY]: DEFAULT_OVERLAY_VERSION,
    ...urlGlobals,
  },
  decorators: [withOverlay],
};

export default preview;
