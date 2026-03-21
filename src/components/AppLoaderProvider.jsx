import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import DhanSourceLoader from "./DhanSourceLoader";

const AppLoaderContext = createContext(null);

/**
 * Global app loader (ref-counted). Call `showLoader` / `hideLoader` around async work.
 * Safe to use `useAppLoader()` outside provider — returns no-op functions.
 */
export function AppLoaderProvider({ children }) {
  const [count, setCount] = useState(0);

  const showLoader = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const value = useMemo(
    () => ({ showLoader, hideLoader }),
    [showLoader, hideLoader],
  );

  return (
    <AppLoaderContext.Provider value={value}>
      {children}
      {count > 0 ? (
        <DhanSourceLoader fullScreen label="Loading…" />
      ) : null}
    </AppLoaderContext.Provider>
  );
}

export function useAppLoader() {
  const ctx = useContext(AppLoaderContext);
  if (!ctx) {
    return {
      showLoader: () => {},
      hideLoader: () => {},
    };
  }
  return ctx;
}
