import type { ReactNode } from "react";
import { useExplorer } from "./ExplorerContext";
import { collectionPath, type ExplorerLocation } from "./locations";

export function ExplorerLink({ to, children }: { to: ExplorerLocation; children: ReactNode }) {
  const { navigate } = useExplorer();
  return <a href={collectionPath(to)} onClick={(event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }}>{children}</a>;
}
