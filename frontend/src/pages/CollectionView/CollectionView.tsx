import {
  CollectionManager,
  Explorer,
  ExplorerProvider,
  useExplorer,
} from "@components";
import styles from "./CollectionView.module.css";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";

function CollectionViewContent() {
  const { current, navigate, revision } = useExplorer();
  const [selection, setSelection] = useState({ location: current, id: current.page === "item" ? current.id : null });
  // Explorer navigation updates the selection; selecting a file leaves the open page alone.
  if (selection.location !== current) {
    setSelection({ location: current, id: current.page === "item" ? current.id : null });
  }

  return (
    <div className={styles.page}>
      <div className={styles.manager_column}>
        <CollectionManager
          selectedItemId={selection.id}
          refreshKey={revision}
          onSelectItem={(id) => setSelection({ location: current, id })}
          onOpenItem={(id) => navigate({ page: "item", id })}
        />
      </div>
      <div className={styles.explorer_column}>
        <div className={styles.explorer_wrapper}>
          <Explorer />
        </div>
      </div>
    </div>
  );
}

export function CollectionView() {
  const [searchParams] = useSearchParams();
  const itemId = Number(searchParams.get("itemId"));
  return (
    <ExplorerProvider initial={Number.isSafeInteger(itemId) && itemId > 0 ? { page: "item", id: itemId } : { page: "home" }}>
      <CollectionViewContent />
    </ExplorerProvider>
  );
}
