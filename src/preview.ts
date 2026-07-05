import { createElement, type ReactNode } from 'react';
import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';

import { KEY, OVERLAY_OPACITY_KEY, OVERLAY_VISIBLE_KEY } from './constants';

type OverlayContext = {
  parameters: {
    figmaOverlaySrc?: string;
  };
  globals: Record<string, unknown>;
};

const overlayDecorator = (Story: () => ReactNode, context: OverlayContext) => {
  const overlaySrc = context.parameters.figmaOverlaySrc as string | undefined;
  const isVisible = Boolean(context.globals[OVERLAY_VISIBLE_KEY]);
  const overlayOpacity = (context.globals[OVERLAY_OPACITY_KEY] as number | undefined) ?? 0.5;

  if (!overlaySrc || !isVisible) return createElement(Story);

  return createElement(
    'div',
    { style: { position: 'relative' } },
    createElement(Story),
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
  },
  decorators: [overlayDecorator],
};

export default preview;
