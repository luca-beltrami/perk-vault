import { useState, useEffect, useCallback } from 'react';
import type { AppState } from '../types';
import { loadAppState, saveAppState, defaultAppState } from './useStorage';

interface UseAppStateResult {
  state: AppState;
  setState: (next: AppState) => void;
  isLoading: boolean;
  error: string | null;
}

export function useAppState(): UseAppStateResult {
  const [state, setLocalState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppState()
      .then((saved) => {
        if (saved !== null) setLocalState(saved);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, []);

  const setState = useCallback((next: AppState) => {
    const withTimestamp = { ...next, lastUpdated: new Date().toISOString() };
    setLocalState(withTimestamp);
    saveAppState(withTimestamp).catch((e) => setError(String(e)));
  }, []);

  return { state, setState, isLoading, error };
}
