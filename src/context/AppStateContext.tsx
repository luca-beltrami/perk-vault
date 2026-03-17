import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppState } from '../types';
import { loadAppState, saveAppState, defaultAppState } from '../hooks/useStorage';
import { resetSkippedPerks } from '../utils/perkUtils';
import { cardLibrary } from '../data/cardLibrary';

interface AppStateContextValue {
  state: AppState;
  setState: (next: AppState) => void;
  isLoading: boolean;
  error: string | null;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setLocalState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppState()
      .then((saved) => {
        if (saved !== null) {
          // Reset any skipped perks whose period has elapsed
          const now = new Date();
          const reset = resetSkippedPerks(saved, cardLibrary, now);
          setLocalState(reset);
          // Persist if resets occurred
          if (reset !== saved) {
            saveAppState(reset).catch((e) => setError(String(e)));
          }
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, []);

  const setState = useCallback((next: AppState) => {
    const withTimestamp = { ...next, lastUpdated: new Date().toISOString() };
    setLocalState(withTimestamp);
    saveAppState(withTimestamp).catch((e) => setError(String(e)));
  }, []);

  return (
    <AppStateContext.Provider value={{ state, setState, isLoading, error }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
