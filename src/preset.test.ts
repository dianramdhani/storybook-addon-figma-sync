import type { Channel } from 'storybook/internal/channels';
import { describe, expect, it, vi } from 'vitest';

import {
  CHANNEL_COMPONENTS_ERROR,
  CHANNEL_COMPONENTS_READY,
  CHANNEL_DISCOVER_COMPONENTS,
  type DiscoverComponentsPayload,
} from './constants';

const { discoverComponentsFromFigma } = vi.hoisted(() => ({ discoverComponentsFromFigma: vi.fn() }));

vi.mock('./lib/figma-sync-server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/figma-sync-server')>()),
  discoverComponentsFromFigma,
}));

import { experimental_serverChannel } from './preset';

function createChannel() {
  const handlers = new Map<string, (payload: unknown) => void | Promise<void>>();
  const channel = {
    on: vi.fn((event: string, handler: (payload: unknown) => void | Promise<void>) => handlers.set(event, handler)),
    emit: vi.fn(),
  } as unknown as Channel;

  return { channel, handlers };
}

describe('experimental_serverChannel component discovery', () => {
  it('returns discovered components for the requesting story', async () => {
    discoverComponentsFromFigma.mockResolvedValue({
      components: [{ componentId: '1:2', name: 'Button', instanceCount: 2 }],
    });
    const { channel, handlers } = createChannel();
    experimental_serverChannel(channel, { envLocation: '../.env.test' });
    const payload: DiscoverComponentsPayload = {
      storyId: 'button--default',
      figmaUrl: 'https://www.figma.com/design/file/Name?node-id=1%3A2',
    };

    await (handlers.get(CHANNEL_DISCOVER_COMPONENTS) as (value: DiscoverComponentsPayload) => Promise<void>)(payload);

    expect(discoverComponentsFromFigma).toHaveBeenCalledWith(payload.figmaUrl, { envLocation: '../.env.test' });
    expect(channel.emit).toHaveBeenCalledWith(CHANNEL_COMPONENTS_READY, {
      storyId: payload.storyId,
      components: [{ componentId: '1:2', name: 'Button', instanceCount: 2 }],
    });
  });

  it('normalizes Figma access errors without losing the story ID', async () => {
    discoverComponentsFromFigma.mockRejectedValue(new Error('Figma API request failed with status 403'));
    const { channel, handlers } = createChannel();
    experimental_serverChannel(channel);
    const payload: DiscoverComponentsPayload = {
      storyId: 'button--default',
      figmaUrl: 'https://www.figma.com/design/file/Name?node-id=1%3A2',
    };

    await (handlers.get(CHANNEL_DISCOVER_COMPONENTS) as (value: DiscoverComponentsPayload) => Promise<void>)(payload);

    expect(channel.emit).toHaveBeenCalledWith(CHANNEL_COMPONENTS_ERROR, {
      storyId: payload.storyId,
      message: 'Figma rejected component discovery. Check FIGMA_TOKEN and access to this Figma file.',
    });
  });

  it('explains the token scope required for discovery', async () => {
    discoverComponentsFromFigma.mockRejectedValue(new Error('Missing FIGMA_TOKEN in env file: .env'));
    const { channel, handlers } = createChannel();
    experimental_serverChannel(channel);
    const payload: DiscoverComponentsPayload = {
      storyId: 'button--default',
      figmaUrl: 'https://www.figma.com/design/file/Name?node-id=1%3A2',
    };

    await (handlers.get(CHANNEL_DISCOVER_COMPONENTS) as (value: DiscoverComponentsPayload) => Promise<void>)(payload);

    expect(channel.emit).toHaveBeenCalledWith(CHANNEL_COMPONENTS_ERROR, {
      storyId: payload.storyId,
      message: 'Figma component discovery requires FIGMA_TOKEN with file_content:read scope.',
    });
  });
});
