export function isValidFigmaDesignUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const isFigmaHost = url.hostname === 'figma.com' || url.hostname.endsWith('.figma.com');
  if (!isFigmaHost) return false;

  const isSupportedPath = /^\/(?:file|design)\/[^/]+/.test(url.pathname);
  if (!isSupportedPath) return false;

  const nodeId = url.searchParams.get('node-id');
  if (!nodeId || nodeId.trim() === '') return false;

  return true;
}

export function getFigmaEmbedUrl(figmaUrl: string): string {
  if (!isValidFigmaDesignUrl(figmaUrl)) {
    throw new Error('Invalid Figma design URL');
  }
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl)}`;
}
