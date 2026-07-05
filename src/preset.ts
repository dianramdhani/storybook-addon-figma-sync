import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import type { Channel } from 'storybook/internal/channels';

import {
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_SAVE_SCREENSHOT,
} from './constants';

const FIGMA_STATIC_DIR = path.join(process.cwd(), '.storybook', '.storybook-addon-sync-figma');
const DEFAULT_ENV_LOCATION = '../.env';

interface FigmaSyncAddonOptions {
  envLocation?: string;
}

export const viteFinal = async (config: unknown) => {
  console.log('This addon is augmenting the Vite config');
  return config;
};

export const webpack = async (config: unknown) => {
  console.log('This addon is augmenting the Webpack config');
  return config;
};

function ensureStaticDir() {
  if (!fs.existsSync(FIGMA_STATIC_DIR)) fs.mkdirSync(FIGMA_STATIC_DIR, { recursive: true });
}

function resolveEnvPath(envLocation = DEFAULT_ENV_LOCATION) {
  if (path.isAbsolute(envLocation)) return envLocation;
  return path.resolve(process.cwd(), '.storybook', envLocation);
}

function loadEnvFile(options: FigmaSyncAddonOptions = {}) {
  const envPath = resolveEnvPath(options.envLocation);
  const result = dotenv.config({ path: envPath });
  if (result.error && !fs.existsSync(envPath)) {
    throw new Error(`Env file not found at ${envPath}`);
  }
  return envPath;
}

function getFigmaToken(options: FigmaSyncAddonOptions = {}) {
  const envPath = loadEnvFile(options);
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error(`Missing FIGMA_TOKEN in env file: ${envPath}`);
  return token;
}

function parseFigmaUrl(figmaUrl: string) {
  let url: URL;
  try {
    url = new URL(figmaUrl);
  } catch {
    throw new Error('Invalid Figma URL');
  }

  const match = url.pathname.match(/^\/(?:file|design)\/([^/]+)/);
  if (!match?.[1]) throw new Error('Could not extract file key from Figma URL');

  const rawNodeId = url.searchParams.get('node-id');
  if (!rawNodeId) throw new Error('Figma URL must include a node-id query parameter');

  return {
    fileKey: match[1],
    nodeId: decodeURIComponent(rawNodeId).replace(/-/g, ':'),
  };
}

async function fetchJson<T>(input: string, token: string) {
  const response = await fetch(input, {
    headers: { 'X-FIGMA-TOKEN': token },
  });

  if (!response.ok) {
    throw new Error(`Figma API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function downloadFile(url: string, filePath: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download overlay image: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

function getOverlayFilename(storyId: string) {
  const safeStoryId = storyId.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `figma-${safeStoryId}.png`;
}

async function downloadOverlayFromFigma(figmaUrl: string, storyId: string, options: FigmaSyncAddonOptions = {}) {
  const token = getFigmaToken(options);
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);

  const imageParams = new URLSearchParams({
    ids: nodeId,
    format: 'png',
    scale: '1',
  });

  const response = await fetchJson<{ images: Record<string, string | null> }>(
    `https://api.figma.com/v1/images/${fileKey}?${imageParams.toString()}`,
    token,
  );

  const imageUrl = response.images[nodeId];
  if (!imageUrl) throw new Error('Figma did not return an image for the requested node');

  ensureStaticDir();
  const filePath = path.join(FIGMA_STATIC_DIR, getOverlayFilename(storyId));
  await downloadFile(imageUrl, filePath);
}

export const experimental_serverChannel = (channel: Channel, options: FigmaSyncAddonOptions = {}) => {
  channel.on(CHANNEL_SAVE_SCREENSHOT, (data: { image: string }) => {
    try {
      const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      ensureStaticDir();
      const filePath = path.join(FIGMA_STATIC_DIR, 'ss.png');
      fs.writeFileSync(filePath, buffer);
      console.log(`[Figma Sync] Screenshot saved successfully to ${filePath}`);
    } catch (err) {
      console.error('[Figma Sync] Failed to save screenshot:', err);
    }
  });

  channel.on(CHANNEL_FETCH_OVERLAY, async (data: { figmaUrl: string; storyId: string }) => {
    try {
      await downloadOverlayFromFigma(data.figmaUrl, data.storyId, options);
      channel.emit(CHANNEL_OVERLAY_READY, {
        figmaUrl: data.figmaUrl,
      });
      console.log(`[Figma Sync] Overlay downloaded successfully from ${data.figmaUrl}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while downloading Figma overlay';
      channel.emit(CHANNEL_OVERLAY_ERROR, { message });
      console.error('[Figma Sync] Failed to download overlay:', err);
    }
  });

  return channel;
};
