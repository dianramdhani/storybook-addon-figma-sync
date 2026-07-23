import React, { memo } from 'react';
import { styled } from 'storybook/theming';

const FrameContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  minHeight: '300px',
  boxSizing: 'border-box',
});

const TopBar = styled.div({
  display: 'flex',
  justify: 'flex-end',
  padding: '6px 12px',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
});

const OpenLink = styled.a({
  fontSize: '12px',
  color: '#006dea',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const StyledIframe = styled.iframe({
  width: '100%',
  height: '100%',
  flex: 1,
  border: 'none',
});

export interface FigmaEmbedFrameProps {
  embedUrl: string;
  figmaUrl: string;
  title?: string;
}

export const FigmaEmbedFrame = memo(function FigmaEmbedFrame({
  embedUrl,
  figmaUrl,
  title = 'Figma Design Embed',
}: FigmaEmbedFrameProps) {
  return (
    <FrameContainer>
      <TopBar>
        <OpenLink href={figmaUrl} target="_blank" rel="noreferrer" aria-label="Open in Figma (opens in new tab)">
          Open in Figma ↗
        </OpenLink>
      </TopBar>
      <StyledIframe src={embedUrl} title={title} allowFullScreen aria-label={title} />
    </FrameContainer>
  );
});
