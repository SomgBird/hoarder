import { Folder } from "@react95/icons";
import { ITEM_TYPE_OPTIONS, type ItemOrdering, type ItemType } from "@types";
import styles from "./CollectionManager.module.css";

interface Props {
  ordering: ItemOrdering;
  onOpenCategory: (category: ItemType) => void;
}

export default function CollectionCategories({ ordering, onOpenCategory }: Props) {
  const categories = [...ITEM_TYPE_OPTIONS].sort((a, b) => a.label.localeCompare(b.label));
  if (ordering.sortBy === "title" && ordering.direction === "desc") categories.reverse();

  return (
    <ul className={styles.icons} aria-label="Collection categories">
      {categories.map(({ value, label }) => (
        <li key={value}>
          <button type="button" className={styles.item} onClick={() => onOpenCategory(value)}>
            <span className={styles.itemIcon} aria-hidden="true"><Folder variant="32x32_4" /></span>
            <span className={styles.itemTitle}>{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
