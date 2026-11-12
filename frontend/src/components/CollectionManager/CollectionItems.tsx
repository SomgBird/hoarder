import { useState } from "react";
import { FileText } from "@react95/icons";
import type { ItemListEntryRead } from "@types";
import { coverUrl } from "@services";
import type { CollectionViewMode } from "./CollectionManagerToolbar";
import styles from "./CollectionManager.module.css";

interface Props {
  items: ItemListEntryRead[];
  view: CollectionViewMode;
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
}

function ItemIcon({ path, size }: { path: string | null; size: 16 | 32 }) {
  const src = coverUrl(path);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <span className={styles.itemIcon} aria-hidden="true" style={{ width: size, height: size }}>
      {src && src !== failedSrc ? (
        <img src={src} alt="" width={size} height={size} onError={() => setFailedSrc(src)} />
      ) : (
        <FileText variant={size === 16 ? "16x16_4" : "32x32_4"} />
      )}
    </span>
  );
}

function ItemDate({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{value}</time> : <>—</>;
}

export default function CollectionItems({ items, view, selectedItemId, onSelectItem }: Props) {
  if (view === "table") {
    return (
      <table className={styles.table} aria-label="Collection items">
        <thead>
          <tr><th scope="col">Title</th><th scope="col">Release date</th><th scope="col">Date added</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} data-selected={item.id === selectedItemId} onClick={() => onSelectItem(item.id)}>
              <td>
                <button type="button" className={styles.tableTitle} aria-current={item.id === selectedItemId}
                  onClick={(event) => { event.stopPropagation(); onSelectItem(item.id); }}>
                  {item.title}
                </button>
              </td>
              <td><ItemDate value={item.release_date} /></td>
              <td><ItemDate value={item.date_added} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <ul className={view === "icons" ? styles.icons : styles.list} aria-label="Collection items">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className={styles.item} aria-current={item.id === selectedItemId}
            onClick={() => onSelectItem(item.id)} title={item.title}>
            <ItemIcon path={item.icon_image_path} size={view === "icons" ? 32 : 16} />
            <span className={styles.itemTitle}>{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
