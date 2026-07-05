import React from 'react';
import { Button, Modal } from 'storybook/internal/components';

import type { AnalysisResult } from '../constants';

interface AnalysisModalProps {
  isOpen: boolean;
  result: AnalysisResult | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function AnalysisModal({ isOpen, result, onOpenChange }: AnalysisModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange} ariaLabel="Figma analysis result" width="100vw" height="100vh">
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          background: '#0f1115',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 32px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div />
          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>
            {result ? `Kemiripan ${result.similarity}%` : 'Analisis'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} ariaLabel={false}>
              Tutup
            </Button>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            flex: 1,
            minHeight: 0,
            padding: '24px 32px 32px',
          }}
        >
          {result ? (
            <>
              <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>Figma</div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    borderRadius: '12px',
                    background: '#16191f',
                    padding: '16px',
                  }}
                >
                  <img
                    src={result.figmaSrc}
                    alt="Figma overlay"
                    style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', minHeight: 0, flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>Screenshot</div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    borderRadius: '12px',
                    background: '#16191f',
                    padding: '16px',
                  }}
                >
                  <img
                    src={result.screenshotSrc}
                    alt="Storybook screenshot"
                    style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ gridColumn: '1 / -1', alignSelf: 'center', justifySelf: 'center', color: '#c8ccd4' }}>
              Hasil analisis belum tersedia.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
