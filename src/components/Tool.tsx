import { LightningIcon } from '@storybook/icons';
import React, { memo, useCallback, useEffect } from 'react';
import { IconButton } from 'storybook/internal/components';
import { type API, useGlobals } from 'storybook/manager-api';

import { ADDON_ID, KEY, TOOL_ID } from '../constants';

export const Tool = memo(function MyAddonSelector({ api }: { api: API }) {
  const [globals, updateGlobals, storyGlobals] = useGlobals();

  const isLocked = KEY in storyGlobals;
  const isActive = !!globals[KEY];

  const toggle = useCallback(() => {
    updateGlobals({
      [KEY]: !isActive,
    });
  }, [isActive]);

  useEffect(() => {
    api.setAddonShortcut(ADDON_ID, {
      label: 'Toggle Measure [O]',
      defaultShortcut: ['O'],
      actionName: 'outline',
      showInMenu: false,
      action: toggle,
    });
  }, [toggle, api]);

  return (
    <IconButton key={TOOL_ID} active={isActive} disabled={isLocked} title="Enable my addon" onClick={toggle}>
      <LightningIcon />
    </IconButton>
  );
});
