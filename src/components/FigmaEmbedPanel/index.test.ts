import { describe, expect, it } from 'vitest';

import { getFigmaEmbedUrl, isValidFigmaDesignUrl } from '../../lib/figma-url';

describe('FigmaEmbedPanel Logic', () => {
  it('correctly constructs figma embed URL from valid figma URL', () => {
    const rawUrl = 'https://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2';
    expect(isValidFigmaDesignUrl(rawUrl)).toBe(true);
    expect(getFigmaEmbedUrl(rawUrl)).toBe(
      `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(rawUrl)}`,
    );
  });

  it('rejects invalid URL', () => {
    const invalidUrl = 'https://example.com/invalid';
    expect(isValidFigmaDesignUrl(invalidUrl)).toBe(false);
  });
});
