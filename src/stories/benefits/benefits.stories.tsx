import type { Meta, StoryObj } from '@storybook/react-vite';

import { Benefits } from '.';

const meta = {
  title: 'Sentri/Benefits',
  component: Benefits,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Benefits>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Tablet: Story = {};
export const Mobile: Story = {};
