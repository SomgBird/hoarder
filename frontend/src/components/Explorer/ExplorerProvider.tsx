import type { ReactNode } from "react";
import { ExplorerContext, useExplorerHistory } from "./ExplorerContext";
import type { ExplorerLocation } from "./locations";

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
