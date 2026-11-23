// components/Explorer/ExplorerContext.ts
// Hooks and context only (no components), so Fast Refresh is happy.
// The <ExplorerProvider> component lives in ExplorerProvider.tsx.
import { createContext, useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collectionPath, parseUrl, toUrl, type ExplorerLocation } from "./locations";

export type ExplorerApi = ReturnType<typeof useExplorerHistory>;

export const ExplorerContext = createContext<ExplorerApi | null>(null);

export function useExplorer(): ExplorerApi {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside <ExplorerProvider>");
  }
  return ctx;
}

interface History {
  stack: string[];
  index: number;
}

function readHistory(saved: Partial<History> | null, address: string): History {
  if (saved && Array.isArray(saved.stack) && saved.stack.every((entry) => typeof entry === "string")
      && typeof saved.index === "number" && Number.isInteger(saved.index) && saved.stack[saved.index] === address) {
    return { stack: saved.stack, index: saved.index };
  }
  return { stack: [address], index: 0 };
}

export function useExplorerHistory(initial: ExplorerLocation) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const address = toUrl(initial);
  const { stack, index } = useMemo(() => readHistory(location.state?.explorerHistory, address), [location.state, address]);
  const current = useMemo(() => parseUrl(stack[index]), [stack, index]);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  const select = (next: History) => {
    // Keep the bookmark and Explorer Back/Forward history in the same router update.
    routerNavigate(collectionPath(parseUrl(next.stack[next.index])), {
      replace: true, state: { ...location.state, explorerHistory: next },
    });
  };
  const navigate = (loc: ExplorerLocation) =>
    select({ stack: [...stack.slice(0, index + 1), toUrl(loc)], index: index + 1 });
  const replace = (loc: ExplorerLocation) =>
    select({ stack: stack.map((entry, i) => i === index ? toUrl(loc) : entry), index });
  const back = () => { if (index > 0) select({ stack, index: index - 1 }); };
  const forward = () => { if (index + 1 < stack.length) select({ stack, index: index + 1 }); };
  const removeItem = (id: number) => {
    const removed = toUrl({ page: "item", id });
    const before = stack.slice(0, index).filter((entry) => entry !== removed);
    const after = stack.slice(index + 1).filter((entry) => entry !== removed);
    select({ stack: [...before, address === removed ? toUrl({ page: "home" }) : address, ...after], index: before.length });
    refresh();
  };

  return {
    current,
    navigate,
    replace,
    back,
    forward,
    refresh,
    revision,
    removeItem,
    canBack: index > 0,
    canForward: index < stack.length - 1,
  };
}
