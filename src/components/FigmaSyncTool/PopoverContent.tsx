import React, { memo } from 'react';
import { Button, Form } from 'storybook/internal/components';
import { styled } from 'storybook/theming';

import { Field } from './Field';

const PopoverWrapper = styled.div({
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '360px',
});

const Row = styled.div({
  display: 'flex',
  gap: '8px',
  width: '100%',
});

const SubmitButton = styled(Button)({
  height: '100%',
  backgroundColor: '#006dea',
  color: '#ffffff',
});

const ControlsRow = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
});

const RangeInput = styled.input({
  flex: 1,
  width: '100%',
});

const StatusText = styled.div<{ isError?: boolean }>(({ isError }) => ({
  fontSize: '12px',
  color: isError ? '#d32f2f' : '#666',
}));

const InfoText = styled.div({
  fontSize: '12px',
  color: '#666',
});

const ActionButton = styled(Button)({
  width: '100%',
  backgroundColor: '#006dea',
  color: '#ffffff',
});

export interface PopoverContentProps {
  localFigmaUrl: string;
  onLocalUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  overlayAvailable: boolean;
  showOverlay: boolean;
  overlayOpacity: number;
  onVisibleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpacityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchMessage: string;
  fetchState: 'idle' | 'loading' | 'success' | 'error';
  analysisMessage: string;
  analysisState: 'idle' | 'loading' | 'success' | 'error';
  onAnalyze: () => void;
  isLoading: boolean;
}

export const PopoverContent = memo(function PopoverContent({
  localFigmaUrl,
  onLocalUrlChange,
  onSubmit,
  overlayAvailable,
  showOverlay,
  overlayOpacity,
  onVisibleChange,
  onOpacityChange,
  fetchMessage,
  fetchState,
  analysisMessage,
  analysisState,
  onAnalyze,
  isLoading,
}: PopoverContentProps) {
  const showFetchMessage = fetchMessage && fetchState !== 'success';
  const showInfoMessage = !overlayAvailable && fetchState !== 'loading';

  return (
    <PopoverWrapper>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #c9cccf !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
        }
      `}</style>
      <Field label="Figma URL">
        <Row>
          <Form.Input
            id="figma-url-input"
            type="text"
            placeholder="https://www.figma.com/file/..."
            value={localFigmaUrl}
            onChange={onLocalUrlChange}
            aria-label="Figma URL input"
          />
          <SubmitButton
            type="button"
            onClick={onSubmit}
            disabled={fetchState === 'loading'}
            ariaLabel="Submit Figma URL"
          >
            Submit
          </SubmitButton>
        </Row>
      </Field>

      {overlayAvailable && (
        <Field label={`Overlay: ${showOverlay ? ` ${overlayOpacity}%` : ' Off'}`}>
          <ControlsRow>
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={onVisibleChange}
              aria-label="Toggle overlay visibility"
            />
            <RangeInput
              type="range"
              min={0}
              max={100}
              step={1}
              value={overlayOpacity}
              onChange={onOpacityChange}
              disabled={!showOverlay}
              aria-label="Overlay opacity slider"
            />
          </ControlsRow>
        </Field>
      )}

      {showFetchMessage && (
        <StatusText isError={fetchState === 'error'} role="status" aria-live="polite">
          {fetchMessage}
        </StatusText>
      )}

      {showInfoMessage && <InfoText>Overlay PNG belum tersedia untuk story ini.</InfoText>}

      {analysisMessage && (
        <StatusText isError={analysisState === 'error'} role="status" aria-live="polite">
          {analysisMessage}
        </StatusText>
      )}

      <ActionButton
        type="button"
        onClick={onAnalyze}
        disabled={!overlayAvailable || isLoading}
        ariaLabel="Analyze screenshot against Figma overlay"
      >
        {isLoading ? 'Please wait...' : 'Analyze Screenshot'}
      </ActionButton>
    </PopoverWrapper>
  );
});
