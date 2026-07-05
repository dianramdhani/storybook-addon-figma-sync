import fs from 'node:fs';
import path from 'node:path';

import type { Channel } from 'storybook/internal/channels';

export const viteFinal = async (config: unknown) => {
  console.log('This addon is augmenting the Vite config');
  return config;
};

export const webpack = async (config: unknown) => {
  console.log('This addon is augmenting the Webpack config');
  return config;
};

export const experimental_serverChannel = (channel: Channel) => {
  channel.on('figma-sync/save-screenshot', (data: { image: string }) => {
    try {
      const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const dirPath = path.join(process.cwd(), '.storybook', '.storybook-addon-figma-sync');
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      const filePath = path.join(dirPath, 'ss.png');
      fs.writeFileSync(filePath, buffer);
      console.log(`[Figma Sync] Screenshot saved successfully to ${filePath}`);
    } catch (err) {
      console.error('[Figma Sync] Failed to save screenshot:', err);
    }
  });

  return channel;
};
