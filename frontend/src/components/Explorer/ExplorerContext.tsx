// components/Explorer/ExplorerContext.ts
// Hooks and context only (no components), so Fast Refresh is happy.
// The <ExplorerProvider> component lives in ExplorerProvider.tsx.
import { createContext, useContext, useState } from "react";
import type { ExplorerLocation } from "./locations";

export type ExplorerApi = ReturnType<typeof useExplorerHistory>;

export const ExplorerContext = createContext<ExplorerApi | null>(null);

export function useExplorer(): ExplorerApi {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside <ExplorerProvider>");
  }
  return ctx;
}

export function useExplorerHistory(initial: ExplorerLocation) {
  const [h, setH] = useState({ stack: [initial], index: 0 });
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  const navigate = (loc: ExplorerLocation) =>
    setH(({ stack, index }) => ({
      stack: [...stack.slice(0, index + 1), loc], // drops the forward entries, like a browser
      index: index + 1,
    }));
  const replace = (loc: ExplorerLocation) =>
    setH(({ stack, index }) => ({
      stack: stack.map((l, i) => (i === index ? loc : l)),
      index,
    }));
  const back = () => setH((s) => ({ ...s, index: Math.max(0, s.index - 1) }));
  const forward = () =>
    setH((s) => ({ ...s, index: Math.min(s.stack.length - 1, s.index + 1) }));
  const removeItem = (id: number) => {
    setH(({ stack, index }) => {
      const keep = (location: ExplorerLocation) => location.page !== "item" || location.id !== id;
      const before = stack.slice(0, index).filter(keep);
      const current: ExplorerLocation = keep(stack[index]) ? stack[index] : { page: "home" };
      return { stack: [...before, current, ...stack.slice(index + 1).filter(keep)], index: before.length };
    });
    refresh();
  };

  return {
    current: h.stack[h.index],
    navigate,
    replace,
    back,
    forward,
    refresh,
    revision,
    removeItem,
    canBack: h.index > 0,
    canForward: h.index < h.stack.length - 1,
  };
}
