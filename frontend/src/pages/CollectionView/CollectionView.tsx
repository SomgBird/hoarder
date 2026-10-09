import {
  CollectionManager,
  Explorer,
  ExplorerProvider,
  useExplorer,
} from "@components";
import styles from "./CollectionView.module.css";

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
  return (
    <ExplorerProvider>
      <CollectionViewContent />
    </ExplorerProvider>
  );
}