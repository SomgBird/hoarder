import { useState } from "react";
import { CollectionManager } from "@components";
import { Explorer } from "@components";
import styles from "./CollectionView.module.css";

export function CollectionView() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.manager_column}>
        <CollectionManager
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
        />
      </div>
      <div>
        <Explorer id={selectedItemId} />
      </div>
    </div>
  );
}
