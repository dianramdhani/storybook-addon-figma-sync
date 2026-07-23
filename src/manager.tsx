import React from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types } from 'storybook/manager-api';

import { FigmaEmbedPanel } from './components/FigmaEmbedPanel';
import { FigmaSyncTool } from './components/FigmaSyncTool';
import { ADDON_ID, PANEL_ID, TOOL_ID } from './constants';

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Figma Sync',
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story)$/)),
    render: () => <FigmaSyncTool />,
  });

  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Figma',
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story)$/)),
    render: ({ active = false }) => (
      <AddonPanel active={active}>
        <FigmaEmbedPanel active={active} />
      </AddonPanel>
    ),
  });
});
