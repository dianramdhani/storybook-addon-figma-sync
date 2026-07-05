export const ADDON_ID = 'storybook-addon-figma-sync';
export const FIGMA_URL_KEY = `${ADDON_ID}/figma-url`;
export const OVERLAY_VISIBLE_KEY = `${ADDON_ID}/overlay-visible`;
export const OVERLAY_OPACITY_KEY = `${ADDON_ID}/overlay-opacity`;
export const FIGMA_STATIC_ASSET_BASE = '/figma-sync-assets';

export const CHANNEL_REQUEST_SCREENSHOT = `${ADDON_ID}/request-screenshot`;
export const CHANNEL_SAVE_SCREENSHOT = `${ADDON_ID}/save-screenshot`;
export const CHANNEL_FETCH_OVERLAY = `${ADDON_ID}/fetch-overlay`;
export const CHANNEL_OVERLAY_READY = `${ADDON_ID}/overlay-ready`;
export const CHANNEL_OVERLAY_ERROR = `${ADDON_ID}/overlay-error`;
export const CHANNEL_ANALYSIS_READY = `${ADDON_ID}/analysis-ready`;
export const CHANNEL_ANALYSIS_ERROR = `${ADDON_ID}/analysis-error`;
export const CHANNEL_DELETE_SCREENSHOT = `${ADDON_ID}/delete-screenshot`;

export function getStoryOverlayFilename(storyId: string) {
  return `figma-${storyId.replace(/[^a-zA-Z0-9-_]/g, '-')}.png`;
}

export function getStoryOverlayAssetPath(storyId: string) {
  return `${FIGMA_STATIC_ASSET_BASE}/${getStoryOverlayFilename(storyId)}`;
}

export function getScreenshotFilename() {
  return 'ss.png';
}

export function getScreenshotAssetPath() {
  return `${FIGMA_STATIC_ASSET_BASE}/${getScreenshotFilename()}`;
}
