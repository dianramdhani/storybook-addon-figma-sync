import { createElement } from 'react';
import type {
  PartialStoryFn as StoryFunction,
  ProjectAnnotations,
  Renderer,
  StoryContext,
} from 'storybook/internal/types';

import { KEY, OVERLAY_OPACITY_KEY, OVERLAY_VISIBLE_KEY } from './constants';

const URL_PARAM_OVERLAY_VISIBLE = 'figmaOverlayVisible';
const URL_PARAM_OVERLAY_OPACITY = 'figmaOverlayOpacity';

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

const withOverlay = (StoryFn: StoryFunction<Renderer>, context: StoryContext<Renderer>) => {
  const overlaySrc = context.parameters.figmaOverlaySrc as string | undefined;
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
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: overlayOpacity,
      },
    }),
  );
};

const preview: ProjectAnnotations<Renderer> = {
  globalTypes: {
    figmaUrl: {
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
    [KEY]: false,
    [OVERLAY_VISIBLE_KEY]: false,
    [OVERLAY_OPACITY_KEY]: 0.5,
    ...urlGlobals,
  },
  decorators: [withOverlay],
};

export default preview;
