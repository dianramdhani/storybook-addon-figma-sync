import type { Meta, StoryObj } from '@storybook/react-vite';

import { Benefits } from '.';

const meta = {
  title: 'Sentri/Benefits',
  component: Benefits,
  parameters: {
    layout: 'fullscreen',
    figmaOverlaySrc: '/figma-sync-assets/sentri-benefits--default.png',
    // figmaOverlaySrc: '/figma-sync-assets/sentri-benefits--mobile.png',
  },
} satisfies Meta<typeof Benefits>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
