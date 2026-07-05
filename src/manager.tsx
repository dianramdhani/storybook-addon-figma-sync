import React from 'react';
import { addons, types } from 'storybook/manager-api';

import { FigmaSyncTool } from './components/FigmaSyncTool';
import { ADDON_ID } from './constants';

// Register the addon
addons.register(ADDON_ID, () => {
  // Register the new Figma Sync tool
  addons.add(`${ADDON_ID}/figma-sync`, {
    type: types.TOOL,
    title: 'Figma Sync',
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story)$/)),
    render: () => <FigmaSyncTool />,
  });
});
