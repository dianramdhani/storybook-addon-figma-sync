import { useEffect, useState } from 'react';

import { STORYBOOK_PREVIEW_IFRAME_SELECTOR } from '../constants';
import { loadImage } from '../lib/load-image';

export function useOverlayAvailability(src: string) {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    loadImage(src)
      .then(() => {
        if (!isCancelled) setIsAvailable(true);
      })
      .catch(() => {
        if (!isCancelled) setIsAvailable(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [src]);

  return isAvailable;
}

export function useOverlayIframeSizing(src: string, isVisible: boolean) {
  useEffect(() => {
    const iframe = document.querySelector(STORYBOOK_PREVIEW_IFRAME_SELECTOR) as HTMLElement | null;
    if (!iframe) return;

    if (!isVisible || !src) {
      iframe.style.width = '';
      iframe.style.height = '';
      return;
    }

    loadImage(src)
      .then((image) => {
        iframe.style.width = `${image.naturalWidth}px`;
        iframe.style.height = `${image.naturalHeight}px`;
      })
      .catch(() => {
        iframe.style.width = '';
        iframe.style.height = '';
      });

    return () => {
      iframe.style.width = '';
      iframe.style.height = '';
    };
  }, [isVisible, src]);
}
