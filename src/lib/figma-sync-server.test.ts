import fs from 'node:fs';
import path from 'node:path';

import { PNG } from 'pngjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  analyzeSavedImages,
  decodePngDataUrl,
  deleteScreenshotFile,
  discoverComponentsFromFigma,
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

  it('rejects overlay download requests for invalid or non-Figma URLs', async () => {
    const { downloadOverlayFromFigma } = await import('./figma-sync-server');
    await expect(
      downloadOverlayFromFigma('https://example.com/design/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2', STORY_ID),
    ).rejects.toThrow('Invalid Figma URL');
  });
});

describe('discoverComponentsFromFigma', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('groups nested instances and links their local or external core components', async () => {
    vi.stubEnv('FIGMA_TOKEN', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nodes: {
              '1:2': {
                document: {
                  id: '1:2',
                  name: 'Page layout',
                  type: 'FRAME',
                  children: [
                    { id: '3:4', name: 'Primary button', type: 'INSTANCE', componentId: '10:1' },
                    {
                      id: '3:5',
                      name: 'Nested frame',
                      type: 'FRAME',
                      children: [
                        { id: '3:6', name: 'Primary button again', type: 'INSTANCE', componentId: '10:1' },
                        { id: '3:7', name: 'Library card', type: 'INSTANCE', componentId: '20:1' },
                        { id: '3:8', name: 'Detached layer', type: 'FRAME' },
                      ],
                    },
                  ],
                },
                components: {
                  '10:1': { name: 'Button / Primary', remote: false },
                  '20:1': { name: 'Card / Default', remote: true, key: 'remote-card-key' },
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ meta: { file_key: 'library-file', node_id: '20:1' } }),
        }),
    );

    await expect(
      discoverComponentsFromFigma('https://www.figma.com/design/source-file/Layout?node-id=1%3A2'),
    ).resolves.toEqual({
      components: [
        {
          componentId: '10:1',
          name: 'Button / Primary',
          instanceCount: 2,
          figmaUrl: 'https://www.figma.com/design/source-file/?node-id=10%3A1',
        },
        {
          componentId: '20:1',
          name: 'Card / Default',
          instanceCount: 1,
          figmaUrl: 'https://www.figma.com/design/library-file/?node-id=20%3A1',
        },
      ],
    });
  });

  it('keeps an instance without component metadata but does not invent a link', async () => {
    vi.stubEnv('FIGMA_TOKEN', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          nodes: {
            '1:2': {
              document: { id: '1:2', name: 'Input', type: 'INSTANCE', componentId: 'missing' },
              components: {},
            },
          },
        }),
      }),
    );

    await expect(
      discoverComponentsFromFigma('https://www.figma.com/design/source-file/Layout?node-id=1%3A2'),
    ).resolves.toEqual({
      components: [
        {
          componentId: 'missing',
          name: 'Input',
          instanceCount: 1,
          unavailableReason: 'Figma did not return metadata for this component.',
        },
      ],
    });
  });

  it('rejects inaccessible nodes and Figma API errors', async () => {
    vi.stubEnv('FIGMA_TOKEN', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ nodes: { '1:2': null } }),
      }),
    );

    await expect(
      discoverComponentsFromFigma('https://www.figma.com/design/source-file/Layout?node-id=1%3A2'),
    ).rejects.toThrow('Figma layout node was not found or is not accessible');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(
      discoverComponentsFromFigma('https://www.figma.com/design/source-file/Layout?node-id=1%3A2'),
    ).rejects.toThrow('Figma API request failed with status 403');
  });
});
