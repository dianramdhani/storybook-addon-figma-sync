import fs from 'node:fs';
import path from 'node:path';

import { PNG } from 'pngjs';
import { afterEach, describe, expect, it } from 'vitest';

import {
  analyzeSavedImages,
  decodePngDataUrl,
  deleteScreenshotFile,
  getOverlayFilePath,
  getScreenshotFilePath,
  writeScreenshotFile,
} from './figma-sync-server';

const STORY_ID = 'test-story';

function createPngBuffer(width: number, height: number, rgba: [number, number, number, number]) {
  const png = new PNG({ width, height });

  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = rgba[0];
    png.data[index + 1] = rgba[1];
    png.data[index + 2] = rgba[2];
    png.data[index + 3] = rgba[3];
  }

  return PNG.sync.write(png);
}

function createDataUrl(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function cleanupFiles() {
  const overlayPath = getOverlayFilePath(STORY_ID);
  const screenshotPath = getScreenshotFilePath(STORY_ID);

  if (fs.existsSync(overlayPath)) fs.unlinkSync(overlayPath);
  if (fs.existsSync(screenshotPath)) fs.unlinkSync(screenshotPath);
}

afterEach(() => {
  cleanupFiles();
});

describe('figma sync server helpers', () => {
  it('decodes PNG data URLs', () => {
    const source = Buffer.from('hello');

    const decoded = decodePngDataUrl(`data:image/png;base64,${source.toString('base64')}`);

    expect(decoded.equals(source)).toBe(true);
  });

  it('writes and deletes screenshot files', () => {
    const screenshot = createPngBuffer(1, 1, [255, 255, 255, 255]);

    writeScreenshotFile(STORY_ID, createDataUrl(screenshot));

    expect(fs.existsSync(getScreenshotFilePath(STORY_ID))).toBe(true);

    deleteScreenshotFile(STORY_ID);

    expect(fs.existsSync(getScreenshotFilePath(STORY_ID))).toBe(false);
  });

  it('returns 100 similarity for identical images', () => {
    const image = createPngBuffer(2, 2, [255, 255, 255, 255]);

    fs.mkdirSync(path.dirname(getOverlayFilePath(STORY_ID)), { recursive: true });
    fs.writeFileSync(getOverlayFilePath(STORY_ID), image);
    writeScreenshotFile(STORY_ID, createDataUrl(image));

    const result = analyzeSavedImages(STORY_ID);

    expect(result.similarity).toBe(100);
    expect(result.figmaSrc).toContain(`figma-${STORY_ID}.png?t=`);
    expect(result.screenshotSrc).toContain(`ss-${STORY_ID}.png?t=`);
  });

  it('throws when image dimensions do not match', () => {
    const overlay = createPngBuffer(2, 2, [255, 255, 255, 255]);
    const screenshot = createPngBuffer(1, 1, [255, 255, 255, 255]);

    fs.mkdirSync(path.dirname(getOverlayFilePath(STORY_ID)), { recursive: true });
    fs.writeFileSync(getOverlayFilePath(STORY_ID), overlay);
    writeScreenshotFile(STORY_ID, createDataUrl(screenshot));

    expect(() => analyzeSavedImages(STORY_ID)).toThrow(/Image dimensions do not match/);
  });
});
