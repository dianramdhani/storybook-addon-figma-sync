import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeroAbout } from '.';

const meta = {
  title: 'Sentri/HeroAbout',
  component: HeroAbout,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HeroAbout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Tablet: Story = {};
export const Mobile: Story = {};
