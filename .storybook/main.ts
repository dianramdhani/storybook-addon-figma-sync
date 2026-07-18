import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineMain } from '@storybook/react-vite/node';
import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const figmaSyncDir = path.join(__dirname, '.storybook-addon-figma-sync');
if (!fs.existsSync(figmaSyncDir)) fs.mkdirSync(figmaSyncDir, { recursive: true });

const config = defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    {
      name: import.meta.resolve('./local-preset.ts'),
      options: {
        envLocation: '../.env',
      },
    },
  ],
  staticDirs: [{ from: './.storybook-addon-figma-sync', to: '/figma-sync-assets' }],
  framework: '@storybook/react-vite',
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': `${process.cwd()}/src`,
        },
      },
    }),
});

export default config;
