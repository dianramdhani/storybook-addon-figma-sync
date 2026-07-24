export const ADDON_ID = 'storybook-addon-figma-sync';
export const TOOL_ID = `${ADDON_ID}/figma-sync`;
export const PANEL_ID = `${ADDON_ID}/figma-panel`;
export const FIGMA_URL_KEY = `${ADDON_ID}/figma-url`;
export const OVERLAY_VISIBLE_KEY = `${ADDON_ID}/overlay-visible`;
export const OVERLAY_OPACITY_KEY = `${ADDON_ID}/overlay-opacity`;
export const OVERLAY_VERSION_KEY = `${ADDON_ID}/overlay-version`;
export const FIGMA_STATIC_ASSET_BASE = '/figma-sync-assets';
export const URL_PARAM_OVERLAY_VISIBLE = 'figmaOverlayVisible';
export const URL_PARAM_OVERLAY_OPACITY = 'figmaOverlayOpacity';
export const DEFAULT_FIGMA_URL = '';
export const DEFAULT_OVERLAY_VISIBLE = false;
export const DEFAULT_OVERLAY_OPACITY = 0.5;
export const DEFAULT_OVERLAY_VERSION = 0;
export const STORYBOOK_PREVIEW_IFRAME_SELECTOR = '#storybook-preview-iframe';

export const CHANNEL_REQUEST_SCREENSHOT = `${ADDON_ID}/request-screenshot`;
export const CHANNEL_SAVE_SCREENSHOT = `${ADDON_ID}/save-screenshot`;
export const CHANNEL_FETCH_OVERLAY = `${ADDON_ID}/fetch-overlay`;
export const CHANNEL_OVERLAY_READY = `${ADDON_ID}/overlay-ready`;
export const CHANNEL_OVERLAY_ERROR = `${ADDON_ID}/overlay-error`;
export const CHANNEL_DISCOVER_COMPONENTS = `${ADDON_ID}/discover-components`;
export const CHANNEL_COMPONENTS_READY = `${ADDON_ID}/components-ready`;
export const CHANNEL_COMPONENTS_ERROR = `${ADDON_ID}/components-error`;
export const CHANNEL_ANALYSIS_READY = `${ADDON_ID}/analysis-ready`;
export const CHANNEL_ANALYSIS_ERROR = `${ADDON_ID}/analysis-error`;
export const CHANNEL_DELETE_SCREENSHOT = `${ADDON_ID}/delete-screenshot`;
export const CHANNEL_SAVE_SETTINGS = `${ADDON_ID}/save-settings`;

export type ScreenshotPurpose = 'capture' | 'analyze';

export interface SaveSettingsPayload {
  storyId: string;
  overlayVisible?: boolean;
  overlayOpacity?: number;
}

export interface RequestScreenshotPayload {
  purpose?: ScreenshotPurpose;
  storyId?: string | null;
  requestId?: string;
}

export interface SaveScreenshotPayload {
  image: string;
  purpose?: ScreenshotPurpose;
  storyId?: string | null;
  requestId?: string;
}

export interface FetchOverlayPayload {
  figmaUrl: string;
  storyId: string;
}

export interface OverlayReadyPayload {
  figmaUrl: string;
}

export interface DiscoverComponentsPayload {
  figmaUrl: string;
  storyId: string;
}

export interface DiscoveredFigmaComponent {
  componentId: string;
  name: string;
  instanceCount: number;
  figmaUrl?: string;
  unavailableReason?: string;
}

export interface ComponentDiscoveryResult {
  components: DiscoveredFigmaComponent[];
}

export interface ComponentsReadyPayload extends ComponentDiscoveryResult {
  storyId: string;
}

export interface ComponentsErrorPayload extends FigmaSyncErrorPayload {
  storyId: string;
}

export interface FigmaSyncErrorPayload {
  message: string;
  requestId?: string;
}

export interface AnalysisResult {
  figmaSrc: string;
  screenshotSrc: string;
  diffSrc: string;
  similarity: number;
}

export interface FigmaSyncGlobals {
  [FIGMA_URL_KEY]: string;
  [OVERLAY_VISIBLE_KEY]: boolean;
  [OVERLAY_OPACITY_KEY]: number;
  [OVERLAY_VERSION_KEY]: number;
}

export function getFigmaUrlGlobal(globals: Record<string, unknown>) {
  return (globals[FIGMA_URL_KEY] as string | undefined) ?? DEFAULT_FIGMA_URL;
}

export function getOverlayVisibleGlobal(globals: Record<string, unknown>) {
  return Boolean(globals[OVERLAY_VISIBLE_KEY]);
}

export function getOverlayOpacityGlobal(globals: Record<string, unknown>) {
  return (globals[OVERLAY_OPACITY_KEY] as number | undefined) ?? DEFAULT_OVERLAY_OPACITY;
}

export function getOverlayVersionGlobal(globals: Record<string, unknown>) {
  return (globals[OVERLAY_VERSION_KEY] as number | undefined) ?? DEFAULT_OVERLAY_VERSION;
}

export function getStoryOverlayFilename(storyId: string) {
  return `figma-${storyId.replace(/[^a-zA-Z0-9-_]/g, '-')}.png`;
}

export function getStoryOverlayAssetPath(storyId: string) {
  return `${FIGMA_STATIC_ASSET_BASE}/${getStoryOverlayFilename(storyId)}`;
}

export function getVersionedStoryOverlayAssetPath(storyId: string, version: number) {
  return `${getStoryOverlayAssetPath(storyId)}?t=${version}`;
}

export function getStoryDiffFilename(storyId: string) {
  return `diff-${storyId.replace(/[^a-zA-Z0-9-_]/g, '-')}.png`;
}

export function getStoryDiffAssetPath(storyId: string) {
  return `${FIGMA_STATIC_ASSET_BASE}/${getStoryDiffFilename(storyId)}`;
}

export function getVersionedStoryDiffAssetPath(storyId: string, version: number) {
  return `${getStoryDiffAssetPath(storyId)}?t=${version}`;
}

export function getScreenshotFilename(storyId: string) {
  return `ss-${storyId.replace(/[^a-zA-Z0-9-_]/g, '-')}.png`;
}

export function getScreenshotAssetPath(storyId: string) {
  return `${FIGMA_STATIC_ASSET_BASE}/${getScreenshotFilename(storyId)}`;
}

export function getVersionedScreenshotAssetPath(storyId: string, version: number) {
  return `${getScreenshotAssetPath(storyId)}?t=${version}`;
}
