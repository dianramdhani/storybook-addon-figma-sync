import { describe, expect, it } from 'vitest';

import { getFigmaEmbedUrl, isValidFigmaDesignUrl } from './figma-url';

describe('isValidFigmaDesignUrl', () => {
  it('returns true for valid figma file and design URLs with node-id', () => {
    expect(isValidFigmaDesignUrl('https://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2')).toBe(
      true,
    );
    expect(isValidFigmaDesignUrl('https://figma.com/design/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=10-20')).toBe(
      true,
    );
  });

  it('returns false for non-HTTPS URLs', () => {
    expect(isValidFigmaDesignUrl('http://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2')).toBe(
      false,
    );
  });

  it('returns false for non-Figma hostnames', () => {
    expect(isValidFigmaDesignUrl('https://example.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2')).toBe(
      false,
    );
    expect(isValidFigmaDesignUrl('https://notfigma.com/design/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2')).toBe(
      false,
    );
  });

  it('returns false for unsupported paths', () => {
    expect(isValidFigmaDesignUrl('https://www.figma.com/community/file/123456?node-id=1%3A2')).toBe(false);
    expect(isValidFigmaDesignUrl('https://www.figma.com/proto/LKQ4abYeAYNNm9g5w82w43/Sample?node-id=1%3A2')).toBe(
      false,
    );
  });

  it('returns false when node-id is missing or empty', () => {
    expect(isValidFigmaDesignUrl('https://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File')).toBe(false);
    expect(isValidFigmaDesignUrl('https://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=')).toBe(false);
  });
});

describe('getFigmaEmbedUrl', () => {
  it('encodes the figma url into the embed endpoint', () => {
    const rawUrl = 'https://www.figma.com/file/LKQ4abYeAYNNm9g5w82w43/Sample-File?node-id=1%3A2';
    const embedUrl = getFigmaEmbedUrl(rawUrl);
    expect(embedUrl).toBe(`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(rawUrl)}`);
  });

  it('throws an error for invalid figma urls', () => {
    expect(() => getFigmaEmbedUrl('https://example.com')).toThrow('Invalid Figma design URL');
  });
});
