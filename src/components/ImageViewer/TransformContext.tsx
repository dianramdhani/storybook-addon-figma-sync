import React, { createContext, useContext, useState } from 'react';

interface TransformContextType {
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  offset: { x: number; y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const TransformContext = createContext<TransformContextType | undefined>(undefined);

export function TransformProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <TransformContext.Provider value={{ scale, setScale, offset, setOffset }}>{children}</TransformContext.Provider>
  );
}

export function useTransform() {
  const context = useContext(TransformContext);
  if (!context) throw new Error('useTransform must be used within a TransformProvider');
  return context;
}
