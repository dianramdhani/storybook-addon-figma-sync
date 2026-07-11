import React from 'react';
import { addons, types } from 'storybook/manager-api';

import { FigmaSyncTool } from './components/FigmaSyncTool';
import { ADDON_ID, TOOL_ID } from './constants';

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Figma Sync',
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story)$/)),
    render: () => <FigmaSyncTool />,
  });
});
