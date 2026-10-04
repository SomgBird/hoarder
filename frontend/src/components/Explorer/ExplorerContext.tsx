// components/Explorer/ExplorerContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { ExplorerLocation } from "./locations";

type ExplorerApi = ReturnType<typeof useExplorerHistory>;

const ExplorerContext = createContext<ExplorerApi | null>(null);

interface ProviderProps {
  children: ReactNode;
  initial?: ExplorerLocation;
}

export function ExplorerProvider({
  children,
  initial = { page: "home" },
}: ProviderProps) {
  const api = useExplorerHistory(initial);
  return (
    <ExplorerContext.Provider value={api}>{children}</ExplorerContext.Provider>
  );
}

export function useExplorer(): ExplorerApi {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside <ExplorerProvider>");
  }
  return ctx;
}

export function useExplorerHistory(initial: ExplorerLocation) {
  const [h, setH] = useState({ stack: [initial], index: 0 });

  const navigate = (loc: ExplorerLocation) =>
    setH(({ stack, index }) => ({
      stack: [...stack.slice(0, index + 1), loc], // drops the forward entries, like a browser
      index: index + 1,
    }));
  const replace = (loc: ExplorerLocation) =>
    setH(({ stack, index }) => ({ stack: stack.map((l, i) => (i === index ? loc : l)), index }));
  const back = () => setH((s) => ({ ...s, index: Math.max(0, s.index - 1) }));
  const forward = () => setH((s) => ({ ...s, index: Math.min(s.stack.length - 1, s.index + 1) }));

  return {
    current: h.stack[h.index],
    navigate, replace, back, forward,
    canBack: h.index > 0,
    canForward: h.index < h.stack.length - 1,
  };
}