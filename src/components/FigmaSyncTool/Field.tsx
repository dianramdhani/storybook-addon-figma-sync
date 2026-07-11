import React, { memo } from 'react';
import { styled } from 'storybook/theming';

const FieldContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

const FieldLabel = styled.label({
  fontSize: '13px',
  fontWeight: 600,
});

const FieldChildren = styled.div({
  display: 'flex',
  gap: '8px',
});

export interface FieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export const Field = memo(function Field({ label, children }: FieldProps) {
  return (
    <FieldContainer>
      <FieldLabel>{label}</FieldLabel>
      <FieldChildren>{children}</FieldChildren>
    </FieldContainer>
  );
});
