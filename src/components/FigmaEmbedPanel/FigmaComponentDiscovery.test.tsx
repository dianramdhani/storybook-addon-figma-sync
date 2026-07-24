import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('storybook/internal/components', () => ({ Button: 'button', Form: { Input: 'input' } }));
vi.mock('storybook/theming', () => ({
  styled: new Proxy((component: string) => () => component, {
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
            variantName: 'Style=Primary',
            instanceCount: 3,
            figmaUrl: 'https://www.figma.com/design/file/?node-id=1%3A2',
          },
        ]}
        state="success"
        message=""
        previewUrls={{ '1:2': 'https://figma.example/preview.png' }}
        previewErrors={{}}
        previewingComponentId={null}
        onInspect={() => {}}
        onPreview={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).toContain('<table');
    expect(markup).toContain('Component');
    expect(markup).toContain('Variant');
    expect(markup).toContain('Style=Primary');
    expect(markup).toContain('Show preview');
    expect(markup).not.toContain('figma.example/preview.png');
    expect(markup).toContain('placeholder="Search components"');
    expect(markup).toContain('aria-label="Search Figma components"');
    expect(markup).toContain('3×');
    expect(markup).toContain('Refresh');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
  });

  it('does not render actions for an unavailable component', () => {
    const markup = renderToStaticMarkup(
      <FigmaComponentDiscovery
        components={[
          { componentId: '1:2', name: 'Button', instanceCount: 1, unavailableReason: 'No metadata available.' },
        ]}
        state="success"
        message=""
        previewUrls={{}}
        previewErrors={{}}
        previewingComponentId={null}
        onInspect={() => {}}
        onPreview={() => {}}
        onClose={() => {}}
      />,
    );

    expect(markup).not.toContain('No metadata available.');
    expect(markup).not.toContain('Open in Figma');
  });

  it('renders accessible loading and empty states', () => {
    const loading = renderToStaticMarkup(
      <FigmaComponentDiscovery
        components={[]}
        state="loading"
        message=""
        previewUrls={{}}
        previewErrors={{}}
        previewingComponentId={null}
        onInspect={() => {}}
        onPreview={() => {}}
        onClose={() => {}}
      />,
    );
    const empty = renderToStaticMarkup(
      <FigmaComponentDiscovery
        components={[]}
        state="success"
        message=""
        previewUrls={{}}
        previewErrors={{}}
        previewingComponentId={null}
        onInspect={() => {}}
        onPreview={() => {}}
        onClose={() => {}}
      />,
    );

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(empty).toContain('No reusable Figma components found in this layout.');
  });
});
