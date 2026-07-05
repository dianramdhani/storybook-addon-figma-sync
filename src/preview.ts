import type { ProjectAnnotations, Renderer } from 'storybook/internal/types';

import { KEY } from './constants';

const preview: ProjectAnnotations<Renderer> = {
  initialGlobals: {
    [KEY]: false,
  },
};

export default preview;
