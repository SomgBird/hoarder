import {
  CollectionManager,
  Explorer,
  ExplorerProvider,
  useExplorer,
} from "@components";
import styles from "./CollectionView.module.css";
import { useSearchParams } from "react-router-dom";

function CollectionViewContent() {
  const { current, navigate } = useExplorer();
  const selectedItemId = current.page === "item" ? current.id : null;

  return (
    <div className={styles.page}>
      <div className={styles.manager_column}>
        <CollectionManager
          selectedItemId={selectedItemId}
          onSelectItem={(id) =>
            navigate(id === null ? { page: "home" } : { page: "item", id })
          }
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
