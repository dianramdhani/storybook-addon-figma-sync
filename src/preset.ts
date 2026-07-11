import fs from 'node:fs';

import type { Channel } from 'storybook/internal/channels';

import {
  CHANNEL_ANALYSIS_ERROR,
  CHANNEL_ANALYSIS_READY,
  CHANNEL_DELETE_SCREENSHOT,
  CHANNEL_FETCH_OVERLAY,
  CHANNEL_OVERLAY_ERROR,
  CHANNEL_OVERLAY_READY,
  CHANNEL_REQUEST_SCREENSHOT,
  CHANNEL_SAVE_SCREENSHOT,
  CHANNEL_SAVE_SETTINGS,
  type FetchOverlayPayload,
  type FigmaSyncErrorPayload,
  type SaveScreenshotPayload,
  type SaveSettingsPayload,
} from './constants';
import {
  analyzeSavedImages,
  deleteScreenshotFile,
  downloadOverlayFromFigma,
  type FigmaSyncAddonOptions,
  getDiffFilePath,
  getOverlayFilePath,
  getScreenshotFilePath,
  updateRegistryEntry,
  writeScreenshotFile,
} from './lib/figma-sync-server';

let serverChannel: Channel | null = null;
let serverOptions: FigmaSyncAddonOptions = {};

interface PendingRequest {
  resolve: (dataUrl: string) => void;
  reject: (err: Error) => void;
  timeoutId: NodeJS.Timeout;
}

const pendingRequests = new Map<string, PendingRequest>();

interface ExpressRequest {
  query: Record<string, string | undefined>;
}

interface ExpressResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): void;
}

interface ExpressRouter {
  get(path: string, handler: (req: ExpressRequest, res: ExpressResponse) => void | Promise<void>): void;
}

interface IncomingMessage {
  url?: string;
}

interface ServerResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk: string): void;
}

interface ConnectServer {
  middlewares: {
    use(middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void): void;
  };
}

interface ViteConfig {
  plugins?: Array<{
    name: string;
    configureServer?(server: ConnectServer): void;
  }>;
}

interface WebpackDevServer {
  app?: {
    get(path: string, handler: (req: ExpressRequest, res: ExpressResponse) => void | Promise<void>): void;
  };
  setupMiddlewares?: (middlewares: unknown, devServer: WebpackDevServer) => unknown;
}

interface WebpackConfig {
  devServer?: WebpackDevServer;
}

export const experimental_serverChannel = (channel: Channel, options: FigmaSyncAddonOptions = {}) => {
  serverChannel = channel;
  serverOptions = options;

  channel.on(CHANNEL_SAVE_SCREENSHOT, (data: SaveScreenshotPayload) => {
    try {
      if (data.requestId && pendingRequests.has(data.requestId)) {
        const pending = pendingRequests.get(data.requestId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingRequests.delete(data.requestId);
          pending.resolve(data.image);
        }
        return;
      }

      if (data.storyId) {
        writeScreenshotFile(data.storyId, data.image);
      }

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

  channel.on(CHANNEL_ANALYSIS_ERROR, (data: FigmaSyncErrorPayload) => {
    if (data.requestId && pendingRequests.has(data.requestId)) {
      const pending = pendingRequests.get(data.requestId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingRequests.delete(data.requestId);
        pending.reject(new Error(data.message));
      }
    }
  });

  channel.on(CHANNEL_FETCH_OVERLAY, async (data: FetchOverlayPayload) => {
    try {
      await downloadOverlayFromFigma(data.figmaUrl, data.storyId, options);
      updateRegistryEntry(data.storyId, {
        overlayVisible: true,
      });
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

  channel.on(CHANNEL_DELETE_SCREENSHOT, (data?: { storyId?: string }) => {
    try {
      if (data?.storyId) {
        deleteScreenshotFile(data.storyId);
      }
    } catch (err) {
      console.error('[Figma Sync] Failed to delete screenshot:', err);
    }
  });

  channel.on(CHANNEL_SAVE_SETTINGS, (data: SaveSettingsPayload) => {
    try {
      if (data.storyId) {
        updateRegistryEntry(data.storyId, {
          overlayVisible: data.overlayVisible,
          overlayOpacity: data.overlayOpacity,
        });
      }
    } catch (err) {
      console.error('[Figma Sync] Failed to save settings:', err);
    }
  });

  return channel;
};

export const previewMiddleware = (router: ExpressRouter) => {
  router.get('/api/figma-sync/screenshot', async (req: ExpressRequest, res: ExpressResponse) => {
    if (!serverChannel) {
      return res.status(503).json({
        success: false,
        error: 'Server channel not initialized. Please ensure the Storybook preview page is open in a browser.',
      });
    }

    const storyId = req.query.storyId;
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'storyId query parameter is required.',
      });
    }

    const figmaUrl = req.query.figmaUrl;
    if (!figmaUrl && !fs.existsSync(getOverlayFilePath(storyId))) {
      return res.status(400).json({
        success: false,
        error:
          'Figma overlay image not found for this story. Please provide the "figmaUrl" query parameter to download it.',
      });
    }

    if (figmaUrl) {
      try {
        await downloadOverlayFromFigma(figmaUrl, storyId, serverOptions);
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: `Failed to download Figma overlay: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    const requestId = Math.random().toString(36).substring(2, 15);

    try {
      const image = await new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pendingRequests.delete(requestId);
          reject(new Error('Request timed out. Please ensure the Storybook preview page is open.'));
        }, 15000);

        pendingRequests.set(requestId, { resolve, reject, timeoutId });

        serverChannel!.emit('selectStory', { storyId });
        serverChannel!.emit('setCurrentStory', { storyId });
        setTimeout(() => {
          serverChannel!.emit(CHANNEL_REQUEST_SCREENSHOT, {
            purpose: 'capture',
            storyId,
            requestId,
          });
        }, 1200);
      });

      writeScreenshotFile(storyId, image);
      const result = analyzeSavedImages(storyId);

      return res.json({
        success: true,
        figmaSrc: getOverlayFilePath(storyId),
        screenshotSrc: getScreenshotFilePath(storyId),
        diffSrc: getDiffFilePath(storyId),
        similarity: result.similarity,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to capture screenshot',
      });
    }
  });
};

export const viteFinal = async (config: ViteConfig) => {
  config.plugins = config.plugins || [];
  config.plugins.push({
    name: 'storybook-addon-figma-sync-middleware',
    configureServer(server: ConnectServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url && req.url.startsWith('/api/figma-sync/screenshot')) {
          const url = new URL(req.url, 'http://localhost');
          const storyId = url.searchParams.get('storyId');
          const figmaUrl = url.searchParams.get('figmaUrl');

          if (!storyId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                error: 'storyId query parameter is required.',
              }),
            );
          }

          if (!serverChannel) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                error: 'Server channel not initialized. Please ensure the Storybook preview page is open in a browser.',
              }),
            );
          }

          if (figmaUrl) {
            try {
              await downloadOverlayFromFigma(figmaUrl, storyId, serverOptions);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: false,
                  error: `Failed to download Figma overlay: ${err instanceof Error ? err.message : String(err)}`,
                }),
              );
            }
          } else if (!fs.existsSync(getOverlayFilePath(storyId))) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                error:
                  'Figma overlay image not found for this story. Please provide the "figmaUrl" query parameter to download it.',
              }),
            );
          }

          const requestId = Math.random().toString(36).substring(2, 15);

          try {
            const image = await new Promise<string>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                pendingRequests.delete(requestId);
                reject(new Error('Request timed out. Please ensure the Storybook preview page is open.'));
              }, 15000);

              pendingRequests.set(requestId, { resolve, reject, timeoutId });

              serverChannel!.emit('selectStory', { storyId });
              serverChannel!.emit('setCurrentStory', { storyId });
              setTimeout(() => {
                serverChannel!.emit(CHANNEL_REQUEST_SCREENSHOT, {
                  purpose: 'capture',
                  storyId,
                  requestId,
                });
              }, 1200);
            });

            writeScreenshotFile(storyId, image);
            const result = analyzeSavedImages(storyId);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: true,
                figmaSrc: getOverlayFilePath(storyId),
                screenshotSrc: getScreenshotFilePath(storyId),
                diffSrc: getDiffFilePath(storyId),
                similarity: result.similarity,
              }),
            );
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : 'Failed to capture screenshot',
              }),
            );
          }
        }
        next();
      });
    },
  });
  return config;
};

export const webpackFinal = async (config: WebpackConfig) => {
  const originalDevServer = config.devServer;
  config.devServer = {
    ...originalDevServer,
    setupMiddlewares: (middlewares: unknown, devServer: WebpackDevServer) => {
      devServer.app?.get('/api/figma-sync/screenshot', async (req: ExpressRequest, res: ExpressResponse) => {
        if (!serverChannel) {
          return res.status(503).json({
            success: false,
            error: 'Server channel not initialized. Please ensure the Storybook preview page is open in a browser.',
          });
        }
        const storyId = req.query.storyId;
        if (!storyId) {
          return res.status(400).json({
            success: false,
            error: 'storyId query parameter is required.',
          });
        }

        const figmaUrl = req.query.figmaUrl;
        if (!figmaUrl && !fs.existsSync(getOverlayFilePath(storyId))) {
          return res.status(400).json({
            success: false,
            error:
              'Figma overlay image not found for this story. Please provide the "figmaUrl" query parameter to download it.',
          });
        }

        if (figmaUrl) {
          try {
            await downloadOverlayFromFigma(figmaUrl, storyId, serverOptions);
          } catch (err) {
            return res.status(500).json({
              success: false,
              error: `Failed to download Figma overlay: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }

        const requestId = Math.random().toString(36).substring(2, 15);

        try {
          const image = await new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              pendingRequests.delete(requestId);
              reject(new Error('Request timed out. Please ensure the Storybook preview page is open.'));
            }, 15000);

            pendingRequests.set(requestId, { resolve, reject, timeoutId });

            serverChannel!.emit('selectStory', { storyId });
            serverChannel!.emit('setCurrentStory', { storyId });
            setTimeout(() => {
              serverChannel!.emit(CHANNEL_REQUEST_SCREENSHOT, {
                purpose: 'capture',
                storyId,
                requestId,
              });
            }, 1200);
          });

          writeScreenshotFile(storyId, image);
          const result = analyzeSavedImages(storyId);

          return res.json({
            success: true,
            figmaSrc: getOverlayFilePath(storyId),
            screenshotSrc: getScreenshotFilePath(storyId),
            diffSrc: getDiffFilePath(storyId),
            similarity: result.similarity,
          });
        } catch (err) {
          return res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : 'Failed to capture screenshot',
          });
        }
      });

      if (originalDevServer?.setupMiddlewares) {
        return originalDevServer.setupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    },
  };
  return config;
};
