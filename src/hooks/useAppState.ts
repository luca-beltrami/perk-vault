// Re-export from context so all screens share one state instance.
// The old per-hook implementation had each screen loading its own copy
// from AsyncStorage on mount, so writes from one screen were invisible
// to other already-mounted screens.
export { useAppState } from '../context/AppStateContext';
