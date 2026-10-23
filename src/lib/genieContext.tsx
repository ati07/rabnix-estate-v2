'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Property } from '@/lib/types';
import { AiGenieChatDrawer } from '@/components/AiGenieChatDrawer';

/**
 * App-wide access to the BayBayt Genie drawer. The drawer is mounted ONCE here,
 * so any component (property cards, detail page, navbar, …) can open it — with
 * an optional property as context — via useGenie().openGenie(property).
 *
 * The drawer component keeps its own conversation state and simply renders null
 * while closed, so opening/closing preserves the chat history.
 */
interface GenieContextType {
  isGenieOpen: boolean;
  openGenie: (property?: Property | null) => void;
  closeGenie: () => void;
}

const GenieContext = createContext<GenieContextType | undefined>(undefined);

export function GenieProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextProperty, setContextProperty] = useState<Property | null>(null);

  const openGenie = useCallback((property?: Property | null) => {
    setContextProperty(property ?? null);
    setIsOpen(true);
  }, []);

  const closeGenie = useCallback(() => setIsOpen(false), []);

  return (
    <GenieContext.Provider value={{ isGenieOpen: isOpen, openGenie, closeGenie }}>
      {children}
      <AiGenieChatDrawer isOpen={isOpen} onClose={closeGenie} contextProperty={contextProperty} />
    </GenieContext.Provider>
  );
}

export function useGenie(): GenieContextType {
  const ctx = useContext(GenieContext);
  if (!ctx) throw new Error('useGenie must be used within a GenieProvider');
  return ctx;
}
