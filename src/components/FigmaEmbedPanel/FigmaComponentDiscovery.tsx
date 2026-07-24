import React, { memo } from 'react';
import { Form } from 'storybook/internal/components';
import { styled } from 'storybook/theming';

import type { DiscoveredFigmaComponent } from '../../constants';
import { ImageViewer, TransformProvider, useTransform } from '../ImageViewer';

const Drawer = styled.aside(({ theme }) => ({
  position: 'absolute',
  zIndex: 1,
  top: 0,
  bottom: 0,
  right: 0,
  width: '100%',
  maxWidth: '600px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.background.content,
  borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.12)',
  padding: '12px 16px',
  boxSizing: 'border-box',
}));

const Header = styled.div({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const HeaderRow = styled.div({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' });
const Title = styled.h2({ margin: 0, fontSize: '13px', whiteSpace: 'nowrap' });
const HeaderActions = styled.div({ display: 'flex', gap: '12px' });
const CloseButton = styled.button({ padding: 0, border: 0, background: 'none', color: '#006dea', cursor: 'pointer' });
const SearchWrapper = styled.div({
  width: '100%',
  maxWidth: '280px',
  alignSelf: 'flex-end',
});
const Status = styled.p<{ isError?: boolean }>(({ isError }) => ({
  margin: '8px 0 0',
  fontSize: '12px',
  color: isError ? '#d32f2f' : '#666',
}));
const TableWrapper = styled.div({ flex: 1, minHeight: 0, marginTop: '10px', overflow: 'auto' });
const Table = styled.table({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
});
const HeadCell = styled.th(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: '8px',
  textAlign: 'left',
  color: '#666',
  backgroundColor: theme.background.content,
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
}));
const Cell = styled.td({ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' });
const Count = styled.span({ color: '#666', whiteSpace: 'nowrap' });
const Reason = styled.div({ marginTop: '2px', color: '#666' });
const OpenLink = styled.a({ color: '#006dea', textDecoration: 'none', whiteSpace: 'nowrap' });
const PreviewButton = styled.button({ padding: 0, border: 0, background: 'none', color: '#006dea', cursor: 'pointer' });
const PreviewContainer = styled.div({
  display: 'flex',
  width: '100%',
  aspectRatio: '1 / 1',
  minHeight: 0,
  overflow: 'hidden',
  overscrollBehavior: 'contain',
  marginTop: '8px',
  '& > *': {
    width: '100%',
    height: '100%',
    minHeight: 0,
  },
});

function ZoomablePreviewCanvas({ src, alt }: { src: string; alt: string }) {
  const { setOffset, setScale } = useTransform();
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [setOffset, setScale, src]);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    setIsDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const { x, y } = dragStart.current;
      dragStart.current = { x: event.clientX, y: event.clientY };
      setOffset((offset) => ({ x: offset.x + event.clientX - x, y: offset.y + event.clientY - y }));
    },
    [isDragging, setOffset],
  );

  const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      setScale((scale) => Math.min(Math.max(scale * factor, 0.5), 10));
    },
    [setScale],
  );

  return (
    <ImageViewer
      title=""
      src={src}
      alt={alt}
      isDarkMode={false}
      isPannable
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    />
  );
}

function ZoomablePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <PreviewContainer>
      <TransformProvider>
        <ZoomablePreviewCanvas src={src} alt={alt} />
      </TransformProvider>
    </PreviewContainer>
  );
}

export interface FigmaComponentDiscoveryProps {
  components: DiscoveredFigmaComponent[];
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  previewUrls: Record<string, string>;
  previewErrors: Record<string, string>;
  previewingComponentId: string | null;
  onInspect: () => void;
  onPreview: (component: DiscoveredFigmaComponent) => void;
  onClose: () => void;
}

export const FigmaComponentDiscovery = memo(function FigmaComponentDiscovery({
  components,
  state,
  message,
  previewUrls,
  previewErrors,
  previewingComponentId,
  onInspect,
  onPreview,
  onClose,
}: FigmaComponentDiscoveryProps) {
  const [expandedComponentIds, setExpandedComponentIds] = React.useState<Set<string>>(() => new Set());
  const [searchTerm, setSearchTerm] = React.useState('');
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredComponents = components.filter((component) =>
    `${component.name} ${component.variantName ?? ''}`.toLowerCase().includes(normalizedSearchTerm),
  );

  const togglePreview = React.useCallback(
    (component: DiscoveredFigmaComponent) => {
      const isPreviewVisible = expandedComponentIds.has(component.componentId);

      setExpandedComponentIds((componentIds) => {
        const nextComponentIds = new Set(componentIds);

        if (isPreviewVisible) {
          nextComponentIds.delete(component.componentId);
        } else {
          nextComponentIds.add(component.componentId);
        }

        return nextComponentIds;
      });
      if (!isPreviewVisible) onPreview(component);
    },
    [expandedComponentIds, onPreview],
  );

  return (
    <Drawer aria-label="Figma component discovery">
      <Header>
        <HeaderRow>
          <Title>Components in this layout</Title>
          <HeaderActions>
            <CloseButton
              type="button"
              onClick={onInspect}
              disabled={state === 'loading'}
              aria-label="Refresh Figma components"
            >
              Refresh
            </CloseButton>
            <CloseButton type="button" onClick={onClose} aria-label="Close Figma components drawer">
              Close
            </CloseButton>
          </HeaderActions>
        </HeaderRow>
        <SearchWrapper>
          <Form.Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search components"
            aria-label="Search Figma components"
          />
        </SearchWrapper>
      </Header>

      {state === 'loading' && (
        <Status role="status" aria-live="polite">
          Inspecting components…
        </Status>
      )}
      {state === 'error' && message && (
        <Status isError role="status" aria-live="polite">
          {message}
        </Status>
      )}
      {state === 'success' && components.length === 0 && (
        <Status>No reusable Figma components found in this layout.</Status>
      )}
      {components.length > 0 && (
        <TableWrapper>
          {filteredComponents.length === 0 ? (
            <Status>No components match “{searchTerm}”.</Status>
          ) : (
            <Table aria-label="Discovered Figma components">
              <thead>
                <tr>
                  <HeadCell scope="col">Component</HeadCell>
                  <HeadCell scope="col">Variant</HeadCell>
                  <HeadCell scope="col">Used</HeadCell>
                  <HeadCell scope="col">Action</HeadCell>
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((component) => {
                  const isPreviewVisible = expandedComponentIds.has(component.componentId);

                  return (
                    <React.Fragment key={component.componentId}>
                      <tr>
                        <Cell>{component.name}</Cell>
                        <Cell>{component.variantName ?? '-'}</Cell>
                        <Cell>
                          <Count>{component.instanceCount}×</Count>
                        </Cell>
                        <Cell>
                          {component.figmaUrl && (
                            <>
                              <PreviewButton
                                type="button"
                                onClick={() => togglePreview(component)}
                                disabled={previewingComponentId === component.componentId}
                              >
                                {previewingComponentId === component.componentId
                                  ? 'Loading…'
                                  : isPreviewVisible
                                    ? 'Hide preview'
                                    : 'Show preview'}
                              </PreviewButton>{' '}
                              <OpenLink href={component.figmaUrl} target="_blank" rel="noreferrer">
                                Open in Figma ↗
                              </OpenLink>
                            </>
                          )}
                          {!component.figmaUrl && '-'}
                        </Cell>
                      </tr>
                      {isPreviewVisible &&
                        (previewUrls[component.componentId] || previewErrors[component.componentId]) && (
                          <tr>
                            <Cell colSpan={4}>
                              {previewUrls[component.componentId] && (
                                <ZoomablePreview
                                  src={previewUrls[component.componentId] ?? ''}
                                  alt={`Figma preview of ${component.name}`}
                                />
                              )}
                              {previewErrors[component.componentId] && (
                                <Reason>{previewErrors[component.componentId]}</Reason>
                              )}
                            </Cell>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          )}
        </TableWrapper>
      )}
    </Drawer>
  );
});
