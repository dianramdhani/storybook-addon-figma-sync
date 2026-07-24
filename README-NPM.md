# Storybook Addon Figma Sync

[![npm version](https://img.shields.io/npm/v/storybook-addon-figma-sync.svg)](https://www.npmjs.com/package/storybook-addon-figma-sync)
[![Storybook version](https://img.shields.io/badge/storybook-%3E%3D8.0.0-ff69b4.svg)](https://storybook.js.org/)
[![License: MIT](https://img.shields.io/npm/l/storybook-addon-figma-sync.svg)](https://opensource.org/licenses/MIT)

A Storybook addon designed to sync Figma design frames directly into Storybook stories. It enables you to overlay mockups on top of live components with adjustable opacity, auto-resize the Storybook preview iframe to match Figma dimensions, and perform pixel-level visual regression diffing directly in the browser to ensure absolute design fidelity.

---

## Key Features

- **Figma Design Integration**: Input any Figma Frame URL in the Storybook toolbar to download and display design mockups.
- **Figma Panel & Component Discovery**: Open the **Figma** bottom panel to inspect reusable components used by the selected layout. The drawer groups component-set variants, shows usage counts, and links resolvable components back to Figma.
- **On-Demand Component Previews**: Request PNG previews only when needed. Previews are cached for the current story, can be shown or hidden, and support scroll-to-zoom and drag-to-pan.
- **Interactive Visual Overlay**: Render the Figma mockup directly over your live component with customizable opacity (0% to 100%) and a toggle switch.
- **Automated Component Sizing**: Storybook's preview iframe automatically resizes to the exact dimensions of the Figma design frame, ensuring realistic component alignment.
- **Pixel-Matching Similarity Analysis**: Compare your live component screenshot pixel-by-pixel with the Figma design using `pixelmatch`.
- **Advanced Analysis Modal**: Switch between three comparison views in the visual audit panel:
  - **Side-by-Side**: Compare the Figma design and live component screenshot side by side.
  - **Overlay (Interactive)**: A draggable and zoomable canvas layer where the Figma mockup is overlaid on the component screenshot.
  - **Diff Only**: A visual diff highlighting the pixel mismatch errors in red.
- **REST API for CI/CD Automation**: Trigger visual audits programmatically via a dev server endpoint, featuring automatic story navigation, render delay buffers, and solid white background compositing for consistent pixelmatch results.
- **Caching Mechanism**: Downloaded Figma design images are stored locally under `.storybook/.storybook-addon-figma-sync/` for fast loading and reduced API consumption.

---

## How to Use (User Workflow)

Using **Figma Sync** in your development workflow is simple:

1. **Paste Figma Frame URL**: Select a story in Storybook, open the **Figma Sync** panel in the toolbar, and paste the URL of your Figma frame.
2. **Review Overlay**: The addon fetches the Figma frame, saves it locally, and overlays it on top of your component. You can toggle the overlay on/off and adjust its opacity using the slider.
3. **Inspect Components**: Open the **Figma** bottom panel and select **Components**. Search by component name or variant, then use **Show preview** for a cached, zoomable PNG preview or **Open in Figma** to inspect the source component.
4. **Auto-Resize**: The Storybook preview iframe automatically resizes to match the width and height of the Figma design frame.
5. **Run Analysis**: Click **"Analyze Screenshot"** to capture a screenshot of your live component.
6. **Inspect Regression**: Use the **Analysis Modal** to review differences in **Side-by-Side**, **Overlay**, or **Diff** modes to spot mismatches down to the single pixel.

Component discovery is cached after the first drawer open. Select **Refresh** when the Figma layout changes. If Figma cannot resolve an instance to a source component, its **Action** column shows `-`; it cannot be previewed or opened from the addon.

### Workflow Diagram

![User Workflow Diagram](./assets/data-flow.svg)

---

## Getting Started

### Prerequisites

- A Figma account and a **Figma Personal Access Token (PAT)**. You can generate one in Figma by going to `Settings > Account > Personal access tokens`.

### Installation

Install the package as a development dependency using your package manager:

```bash
yarn add -D storybook-addon-figma-sync
# or
npm install --save-dev storybook-addon-figma-sync
# or
pnpm add -D storybook-addon-figma-sync
```

### Configuration

#### 1. Register the Addon

Add the addon to your `.storybook/main.ts` file:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    {
      name: 'storybook-addon-figma-sync',
      options: {
        envLocation: '../.env', // Path to your environment file containing FIGMA_TOKEN
      },
    },
  ],
  // Map local cache directory to static URL in Storybook
  staticDirs: [{ from: './.storybook-addon-figma-sync', to: '/figma-sync-assets' }],
  framework: '@storybook/react-vite',
};

export default config;
```

#### 2. Set Up Environment Variables

Create a `.env` file at the root of your project:

```bash
FIGMA_TOKEN=your_figma_personal_access_token_here
```

#### 3. Update Git Ignore

Add the local cache folder to your `.gitignore` to prevent committing cached Figma designs and screenshot differences:

```bash
.storybook/.storybook-addon-figma-sync/
```

---

## REST API for Automated Visual Audits

The addon exposes a built-in REST API endpoint on the Storybook dev server for programmatic triggers (e.g., for CI pipelines, external scripts, or automated tools).

### Endpoint

```http
GET http://localhost:6006/api/figma-sync/screenshot?storyId=<STORY_ID>
```

### Response Example

```json
{
  "success": true,
  "figmaSrc": "/figma-sync-assets/figma-<storyId>.png",
  "screenshotSrc": "/figma-sync-assets/ss-<storyId>.png",
  "diffSrc": "/figma-sync-assets/diff-<storyId>.png",
  "similarity": 94.25
}
```

### Key Behaviors

1. **Auto-Navigation**: The dev server middleware automatically navigates the active story in the Storybook preview iframe to match the requested `storyId`, utilizing a `1200ms` delay buffer to let the render tree settle before capturing the screenshot.
2. **Transparency Compositing**: To resolve false mismatches from alpha channel transparency (e.g., empty backgrounds, transparent PNGs), both the Figma mockup and the captured screenshot are composited onto a solid white background prior to pixelmatch comparison.
3. **Ignoring Elements**: Specific HTML elements can be excluded from screenshots by applying the `data-figma-sync-ignore="true"` attribute to them.

---

## License

This project is licensed under the **MIT License**.
