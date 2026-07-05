import type { Channel } from 'storybook/internal/channels';

import {
  CHANNEL_ANALYSIS_ERROR,
  CHANNEL_ANALYSIS_READY,
  CHANNEL_DELETE_SCREENSHOT,
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_SAVE_SCREENSHOT,
  type FetchOverlayPayload,
  type FigmaSyncErrorPayload,
  type SaveScreenshotPayload,
} from './constants';
import {
  analyzeSavedImages,
  deleteScreenshotFile,
  downloadOverlayFromFigma,
  type FigmaSyncAddonOptions,
  writeScreenshotFile,
} from './lib/figma-sync-server';

export const experimental_serverChannel = (channel: Channel, options: FigmaSyncAddonOptions = {}) => {
  channel.on(CHANNEL_SAVE_SCREENSHOT, (data: SaveScreenshotPayload) => {
    try {
      writeScreenshotFile(data.image);

      if (data.purpose === 'analyze' && data.storyId) {
        const result = analyzeSavedImages(data.storyId);
        channel.emit(CHANNEL_ANALYSIS_READY, result);
      }
    } catch (err) {
      if (data.purpose === 'analyze') {
        const errorPayload: FigmaSyncErrorPayload = {
          message: err instanceof Error ? err.message : 'Unknown error while analyzing screenshot',
        };
        channel.emit(CHANNEL_ANALYSIS_ERROR, errorPayload);
      }
      console.error('[Figma Sync] Failed to save screenshot:', err);
    }
  });

  channel.on(CHANNEL_FETCH_OVERLAY, async (data: FetchOverlayPayload) => {
    try {
      await downloadOverlayFromFigma(data.figmaUrl, data.storyId, options);
      channel.emit(CHANNEL_OVERLAY_READY, {
        figmaUrl: data.figmaUrl,
      });
    } catch (err) {
      const errorPayload: FigmaSyncErrorPayload = {
        message: err instanceof Error ? err.message : 'Unknown error while downloading Figma overlay',
      };
      channel.emit(CHANNEL_OVERLAY_ERROR, errorPayload);
      console.error('[Figma Sync] Failed to download overlay:', err);
    }
  });

  channel.on(CHANNEL_DELETE_SCREENSHOT, () => {
    try {
      deleteScreenshotFile();
    } catch (err) {
      console.error('[Figma Sync] Failed to delete screenshot:', err);
    }
  });

  return channel;
};
