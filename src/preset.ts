import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { Channel } from 'storybook/internal/channels';

import {
  CHANNEL_ANALYSIS_ERROR,
  CHANNEL_ANALYSIS_READY,
  CHANNEL_DELETE_SCREENSHOT,
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

function getOverlayFilePath(storyId: string) {
  return path.join(FIGMA_STATIC_DIR, getOverlayFilename(storyId));
}

function getOverlayAssetUrl(storyId: string, version: number) {
  return `/figma-sync-assets/${getOverlayFilename(storyId)}?t=${version}`;
}

function getScreenshotAssetUrl(version: number) {
  return `/figma-sync-assets/ss.png?t=${version}`;
}

function getScreenshotFilePath() {
  return path.join(FIGMA_STATIC_DIR, 'ss.png');
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
  const filePath = getOverlayFilePath(storyId);
  await downloadFile(imageUrl, filePath);
}

function analyzeSavedImages(storyId: string) {
  const overlayPath = getOverlayFilePath(storyId);
  const screenshotPath = getScreenshotFilePath();

  if (!fs.existsSync(overlayPath)) {
    throw new Error(`Overlay PNG not found for story ${storyId}`);
  }

  if (!fs.existsSync(screenshotPath)) {
    throw new Error('Screenshot PNG not found');
  }

  const overlayImage = PNG.sync.read(fs.readFileSync(overlayPath));
  const screenshotImage = PNG.sync.read(fs.readFileSync(screenshotPath));

  if (overlayImage.width !== screenshotImage.width || overlayImage.height !== screenshotImage.height) {
    throw new Error(
      `Image dimensions do not match: ${overlayImage.width}x${overlayImage.height} vs ${screenshotImage.width}x${screenshotImage.height}`,
    );
  }

  const diffPixels = pixelmatch(
    overlayImage.data,
    screenshotImage.data,
    null,
    overlayImage.width,
    overlayImage.height,
    { threshold: 0.1 },
  );

  const totalPixels = overlayImage.width * overlayImage.height;
  const similarity = Number((((totalPixels - diffPixels) / totalPixels) * 100).toFixed(2));
  const version = Date.now();

  return {
    figmaSrc: getOverlayAssetUrl(storyId, version),
    screenshotSrc: getScreenshotAssetUrl(version),
    similarity,
  };
}

export const experimental_serverChannel = (channel: Channel, options: FigmaSyncAddonOptions = {}) => {
  channel.on(
    CHANNEL_SAVE_SCREENSHOT,
    (data: { image: string; purpose?: 'capture' | 'analyze'; storyId?: string | null }) => {
      try {
        const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        ensureStaticDir();
        const filePath = getScreenshotFilePath();
        fs.writeFileSync(filePath, buffer);
        console.log(`[Figma Sync] Screenshot saved successfully to ${filePath}`);

        if (data.purpose === 'analyze' && data.storyId) {
          const result = analyzeSavedImages(data.storyId);
          channel.emit(CHANNEL_ANALYSIS_READY, result);
        }
      } catch (err) {
        if (data.purpose === 'analyze') {
          const message = err instanceof Error ? err.message : 'Unknown error while analyzing screenshot';
          channel.emit(CHANNEL_ANALYSIS_ERROR, { message });
        }
        console.error('[Figma Sync] Failed to save screenshot:', err);
      }
    },
  );

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

  channel.on(CHANNEL_DELETE_SCREENSHOT, () => {
    try {
      const screenshotPath = getScreenshotFilePath();
      if (fs.existsSync(screenshotPath)) {
        fs.unlinkSync(screenshotPath);
        console.log(`[Figma Sync] Screenshot deleted successfully from ${screenshotPath}`);
      }
    } catch (err) {
      console.error('[Figma Sync] Failed to delete screenshot:', err);
    }
  });

  return channel;
};
