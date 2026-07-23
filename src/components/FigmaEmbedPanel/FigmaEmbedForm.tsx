import React, { memo } from 'react';
import { Button, Form } from 'storybook/internal/components';
import { styled } from 'storybook/theming';

import { Field } from '../FigmaSyncTool/Field';

const FormWrapper = styled.form({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxWidth: '480px',
});

const Row = styled.div({
  display: 'flex',
  gap: '8px',
  width: '100%',
});

const SubmitButton = styled(Button)({
  backgroundColor: '#006dea',
  color: '#ffffff',
});

const StatusText = styled.div<{ isError?: boolean }>(({ isError }) => ({
  fontSize: '12px',
  color: isError ? '#d32f2f' : '#666',
}));

const InstructionText = styled.p({
  margin: 0,
  fontSize: '13px',
  color: '#666',
  lineHeight: '1.4',
});

export interface FigmaEmbedFormProps {
  figmaUrl: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  fetchState: 'idle' | 'loading' | 'success' | 'error';
  fetchMessage: string;
}

export const FigmaEmbedForm = memo(function FigmaEmbedForm({
  figmaUrl,
  onChange,
  onSubmit,
  fetchState,
  fetchMessage,
}: FigmaEmbedFormProps) {
  return (
    <FormWrapper onSubmit={onSubmit} aria-label="Formulir tautan Figma">
      <InstructionText>
        Desain Figma belum dihubungkan ke story ini. Masukkan URL Figma untuk menghubungkannya.
      </InstructionText>
      <Field label="URL Figma">
        <Row>
          <Form.Input
            id="figma-embed-panel-url-input"
            type="text"
            placeholder="https://www.figma.com/file/..."
            value={figmaUrl}
            onChange={onChange}
            aria-label="URL Figma"
          />
          <SubmitButton type="submit" disabled={fetchState === 'loading'} ariaLabel="Simpan URL Figma">
            Submit
          </SubmitButton>
        </Row>
      </Field>

      {fetchState === 'loading' && (
        <StatusText role="status" aria-live="polite">
          Loading...
        </StatusText>
      )}

      {fetchMessage && fetchState !== 'success' && fetchState !== 'loading' && (
        <StatusText isError={fetchState === 'error'} role="status" aria-live="polite">
          {fetchMessage}
        </StatusText>
      )}
    </FormWrapper>
  );
});
