import { LinkIcon } from '@storybook/icons';
import React, { memo, useCallback, useState } from 'react';
import { Button, Form, IconButton, WithTooltip } from 'storybook/internal/components';
import { useGlobals } from 'storybook/manager-api';

export const FigmaSyncTool = memo(function FigmaSyncTool() {
  const [globals, updateGlobals] = useGlobals();
  const [figmaUrl, setFigmaUrl] = useState((globals['figmaUrl'] as string) || '');

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>, onHide: () => void) => {
      e.preventDefault();
      updateGlobals({ figmaUrl });
      console.log('Submitted Figma URL:', figmaUrl);
      onHide();
    },
    [figmaUrl, updateGlobals],
  );

  return (
    <WithTooltip
      placement="bottom"
      trigger="click"
      closeOnOutsideClick
      tooltip={({ onHide }) => (
        <Form
          onSubmit={(e) => handleSubmit(e, onHide)}
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '280px',
            fontFamily: 'sans-serif',
          }}
        >
          <Form.Field label="Figma URL">
            <Form.Input
              id="figma-url-input"
              type="text"
              placeholder="https://www.figma.com/file/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
            />
          </Form.Field>
          <Button type="submit" variant="solid">
            Submit
          </Button>
        </Form>
      )}
    >
      <IconButton variant="ghost" title="Figma Sync" active={!!globals['figmaUrl']}>
        <LinkIcon />
      </IconButton>
    </WithTooltip>
  );
});
