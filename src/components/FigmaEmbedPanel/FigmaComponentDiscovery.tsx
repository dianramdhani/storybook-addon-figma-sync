import React, { memo } from 'react';
import { styled } from 'storybook/theming';

import type { DiscoveredFigmaComponent } from '../../constants';

const Drawer = styled.aside(({ theme }) => ({
  position: 'absolute',
  zIndex: 1,
  top: 0,
  bottom: 0,
  right: 0,
  width: '100%',
  maxWidth: '400px',
  overflow: 'auto',
  backgroundColor: theme.background.content,
  borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.12)',
  padding: '12px 16px',
  boxSizing: 'border-box',
}));

const Header = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
});

const Title = styled.h2({ margin: 0, fontSize: '13px' });
const HeaderActions = styled.div({ display: 'flex', gap: '12px' });
const CloseButton = styled.button({ padding: 0, border: 0, background: 'none', color: '#006dea', cursor: 'pointer' });
const Status = styled.p<{ isError?: boolean }>(({ isError }) => ({
  margin: '8px 0 0',
  fontSize: '12px',
  color: isError ? '#d32f2f' : '#666',
}));
const TableWrapper = styled.div({ marginTop: '10px', overflowX: 'auto' });
const Table = styled.table({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
});
const HeadCell = styled.th({
  padding: '8px',
  textAlign: 'left',
  color: '#666',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
});
const Cell = styled.td({ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' });
const Count = styled.span({ color: '#666', whiteSpace: 'nowrap' });
const Reason = styled.div({ marginTop: '2px', color: '#666' });
const OpenLink = styled.a({ color: '#006dea', textDecoration: 'none', whiteSpace: 'nowrap' });

export interface FigmaComponentDiscoveryProps {
  components: DiscoveredFigmaComponent[];
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  onInspect: () => void;
  onClose: () => void;
}

export const FigmaComponentDiscovery = memo(function FigmaComponentDiscovery({
  components,
  state,
  message,
  onInspect,
  onClose,
}: FigmaComponentDiscoveryProps) {
  return (
    <Drawer aria-label="Figma component discovery">
      <Header>
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
          <Table aria-label="Discovered Figma components">
            <thead>
              <tr>
                <HeadCell scope="col">Component</HeadCell>
                <HeadCell scope="col">Used</HeadCell>
                <HeadCell scope="col">Action</HeadCell>
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.componentId}>
                  <Cell>
                    {component.name}
                    {component.unavailableReason && <Reason>{component.unavailableReason}</Reason>}
                  </Cell>
                  <Cell>
                    <Count>{component.instanceCount}×</Count>
                  </Cell>
                  <Cell>
                    {component.figmaUrl ? (
                      <OpenLink href={component.figmaUrl} target="_blank" rel="noreferrer">
                        Open in Figma ↗
                      </OpenLink>
                    ) : (
                      '—'
                    )}
                  </Cell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </Drawer>
  );
});
