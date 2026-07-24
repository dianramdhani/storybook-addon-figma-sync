import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('storybook/internal/components', () => ({ Button: 'button' }));
vi.mock('storybook/theming', () => ({
  styled: new Proxy(() => undefined, {
    get: (_target, tag) => () => tag,
  }),
}));

import { FigmaComponentDiscovery } from './FigmaComponentDiscovery';

describe('FigmaComponentDiscovery', () => {
  it('renders a safe Figma link and component usage', () => {
    const markup = renderToStaticMarkup(
      <FigmaComponentDiscovery
        components={[
          {
            componentId: '1:2',
            name: 'Button',
            instanceCount: 3,
            figmaUrl: 'https://www.figma.com/design/file/?node-id=1%3A2',
          },
        ]}
        state="success"
        message=""
        onInspect={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('<table');
    expect(markup).toContain('Component');
    expect(markup).toContain('3×');
    expect(markup).toContain('Refresh');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
  });

  it('renders an unavailable reason without an invented link', () => {
    const markup = renderToStaticMarkup(
      <FigmaComponentDiscovery
        components={[
          { componentId: '1:2', name: 'Button', instanceCount: 1, unavailableReason: 'No metadata available.' },
        ]}
        state="success"
        message=""
        onInspect={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('No metadata available.');
    expect(markup).not.toContain('Open in Figma');
  });

  it('renders accessible loading and empty states', () => {
    const loading = renderToStaticMarkup(
      <FigmaComponentDiscovery components={[]} state="loading" message="" onInspect={() => {}} onClose={() => {}} />,
    );
    const empty = renderToStaticMarkup(
      <FigmaComponentDiscovery components={[]} state="success" message="" onInspect={() => {}} onClose={() => {}} />,
    );

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(empty).toContain('No reusable Figma components found in this layout.');
  });
});
