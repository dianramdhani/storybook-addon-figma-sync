import type { FigmaSyncGlobals, RequestScreenshotPayload, SaveScreenshotPayload } from '../constants';
import {
  getVersionedStoryOverlayAssetPath,
  OVERLAY_OPACITY_KEY,
  OVERLAY_VISIBLE_KEY,
  URL_PARAM_OVERLAY_OPACITY,
  URL_PARAM_OVERLAY_VISIBLE,
} from '../constants';
import { loadImage } from './load-image';

export interface OverlayDimensions {
  width: number;
  height: number;
}

export function getInitialGlobalsFromUrl(): Partial<FigmaSyncGlobals> {
  const params = new URLSearchParams(window.location.search);
  const updates: Partial<FigmaSyncGlobals> = {};
  const visibleParam = params.get(URL_PARAM_OVERLAY_VISIBLE);
  const opacityParam = params.get(URL_PARAM_OVERLAY_OPACITY);

  if (visibleParam !== null) updates[OVERLAY_VISIBLE_KEY] = visibleParam === '1';
  if (opacityParam !== null) {
    const parsed = parseFloat(opacityParam);
    if (!isNaN(parsed)) updates[OVERLAY_OPACITY_KEY] = parsed / 100;
  }

  return updates;
}

export async function getOverlayDimensions(storyId?: string | null) {
  if (!storyId) return null;

  try {
    const image = await loadImage(getVersionedStoryOverlayAssetPath(storyId, Date.now()));
    return { width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    return null;
  }
}

export function getCaptureDimensions(overlayDimensions: OverlayDimensions | null): OverlayDimensions {
  return {
    width: overlayDimensions?.width ?? window.innerWidth,
    height: overlayDimensions?.height ?? window.innerHeight,
  };
}

export function createScreenshotPayload(dataUrl: string, payload?: RequestScreenshotPayload): SaveScreenshotPayload {
  return {
    image: dataUrl,
    purpose: payload?.purpose ?? 'capture',
    storyId: payload?.storyId ?? null,
  };
}
