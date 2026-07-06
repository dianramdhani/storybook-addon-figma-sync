import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import type { AnalysisResult } from '../constants';
import {
  getScreenshotFilename,
  getStoryDiffFilename,
  getStoryOverlayFilename,
  getVersionedScreenshotAssetPath,
  getVersionedStoryDiffAssetPath,
  getVersionedStoryOverlayAssetPath,
} from '../constants';

const FIGMA_STATIC_DIR = path.join(process.cwd(), '.storybook', '.storybook-addon-sync-figma');
const DEFAULT_ENV_LOCATION = '../.env';

export interface FigmaSyncAddonOptions {
  envLocation?: string;
}

interface ParsedFigmaUrl {
  fileKey: string;
  nodeId: string;
}

export function ensureStaticDir() {
  if (!fs.existsSync(FIGMA_STATIC_DIR)) fs.mkdirSync(FIGMA_STATIC_DIR, { recursive: true });
}

export function getOverlayFilePath(storyId: string) {
  return path.join(FIGMA_STATIC_DIR, getStoryOverlayFilename(storyId));
}

export function getDiffFilePath(storyId: string) {
  return path.join(FIGMA_STATIC_DIR, getStoryDiffFilename(storyId));
}

export function getScreenshotFilePath() {
  return path.join(FIGMA_STATIC_DIR, getScreenshotFilename());
}

export function decodePngDataUrl(image: string) {
  return Buffer.from(image.replace(/^data:image\/png;base64,/, ''), 'base64');
}

export function writeScreenshotFile(image: string) {
  ensureStaticDir();
  fs.writeFileSync(getScreenshotFilePath(), decodePngDataUrl(image));
}

function resolveEnvPath(envLocation = DEFAULT_ENV_LOCATION) {
  if (path.isAbsolute(envLocation)) return envLocation;
  return path.resolve(process.cwd(), '.storybook', envLocation);
}

function loadEnvFile(options: FigmaSyncAddonOptions = {}) {
  const envPath = resolveEnvPath(options.envLocation);
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    if (!fs.existsSync(envPath)) {
      throw new Error(`Env file not found at ${envPath}`);
    }

    throw result.error;
  }
  return envPath;
}

function getFigmaToken(options: FigmaSyncAddonOptions = {}) {
  const envPath = loadEnvFile(options);
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error(`Missing FIGMA_TOKEN in env file: ${envPath}`);
  return token;
}

function sanitizeFigmaNodeId(nodeId: string) {
  return decodeURIComponent(nodeId).replace(/-/g, ':');
}

function parseFigmaUrl(figmaUrl: string): ParsedFigmaUrl {
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
    nodeId: sanitizeFigmaNodeId(rawNodeId),
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

function readPngFromFile(filePath: string) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function assertFileExists(filePath: string, message: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message);
  }
}

function calculateImageSimilarity(overlayImage: PNG, screenshotImage: PNG, diffPath: string) {
  if (overlayImage.width !== screenshotImage.width || overlayImage.height !== screenshotImage.height) {
    throw new Error(
      `Image dimensions do not match: ${overlayImage.width}x${overlayImage.height} vs ${screenshotImage.width}x${screenshotImage.height}`,
    );
  }

  const diffImage = new PNG({ width: overlayImage.width, height: overlayImage.height });
  const diffPixels = pixelmatch(
    overlayImage.data,
    screenshotImage.data,
    diffImage.data,
    overlayImage.width,
    overlayImage.height,
    { threshold: 0.1 },
  );

  fs.writeFileSync(diffPath, PNG.sync.write(diffImage));
  const totalPixels = overlayImage.width * overlayImage.height;

  return Number((((totalPixels - diffPixels) / totalPixels) * 100).toFixed(2));
}

function createAnalysisResult(storyId: string, similarity: number): AnalysisResult {
  const version = Date.now();

  return {
    figmaSrc: getVersionedStoryOverlayAssetPath(storyId, version),
    screenshotSrc: getVersionedScreenshotAssetPath(version),
    diffSrc: getVersionedStoryDiffAssetPath(storyId, version),
    similarity,
  };
}

export async function downloadOverlayFromFigma(figmaUrl: string, storyId: string, options: FigmaSyncAddonOptions = {}) {
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
  await downloadFile(imageUrl, getOverlayFilePath(storyId));
}

export function analyzeSavedImages(storyId: string): AnalysisResult {
  const overlayPath = getOverlayFilePath(storyId);
  const screenshotPath = getScreenshotFilePath();
  const diffPath = getDiffFilePath(storyId);

  assertFileExists(overlayPath, `Overlay PNG not found for story ${storyId}`);
  assertFileExists(screenshotPath, 'Screenshot PNG not found');

  const overlayImage = readPngFromFile(overlayPath);
  const screenshotImage = readPngFromFile(screenshotPath);
  const similarity = calculateImageSimilarity(overlayImage, screenshotImage, diffPath);

  return createAnalysisResult(storyId, similarity);
}

export function deleteScreenshotFile() {
  const screenshotPath = getScreenshotFilePath();
  if (fs.existsSync(screenshotPath)) {
    fs.unlinkSync(screenshotPath);
  }
}
