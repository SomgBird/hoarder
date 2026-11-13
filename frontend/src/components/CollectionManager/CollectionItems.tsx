import { useState } from "react";
import { FileText } from "@react95/icons";
import { ITEM_TYPES, ITEM_TYPE_LABELS, type ItemListEntryRead } from "@types";
import { coverUrl } from "@services";
import type { CollectionItemViewMode } from "./CollectionManagerToolbar";
import styles from "./CollectionManager.module.css";

interface Props {
  items: ItemListEntryRead[];
  view: CollectionItemViewMode;
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
}

function ItemIcon({ path, size }: { path: string | null; size: 16 | 32 | 64 }) {
  const src = coverUrl(path);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <span className={styles.itemIcon} aria-hidden="true" style={{ width: size, height: size }}>
      {src && src !== failedSrc ? (
        <img src={src} alt="" width={size} height={size} onError={() => setFailedSrc(src)} />
      ) : (
        <FileText variant={size === 16 ? "16x16_4" : "32x32_4"} width={size} height={size} />
      )}
    </span>
  );
}

function ItemDate({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{value}</time> : <>—</>;
}

function ItemSummary({ item }: { item: ItemListEntryRead }) {
  const type = ITEM_TYPES.find((type) => type === item.item_type);
  return (
    <span className={styles.summary}>
      <span className={styles.summaryTitle}>{item.title}</span>
      <span>
        <span>{type ? ITEM_TYPE_LABELS[type] : item.item_type}</span>
        <span aria-hidden="true"> · </span>
        <span>{item.is_owned ? "Owned" : "Not owned"}</span>
      </span>
      <span className={styles.summaryDetails}>
        <span>Release date: <ItemDate value={item.release_date} /></span>
        <span>Date added: <ItemDate value={item.date_added} /></span>
      </span>
    </span>
  );
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
    <ul className={view === "minipages" ? styles.minipages : view === "icons" ? styles.icons : styles.list} aria-label="Collection items">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className={styles.item} aria-current={item.id === selectedItemId}
            onClick={() => onSelectItem(item.id)} title={item.title}>
            <ItemIcon path={item.icon_image_path} size={view === "minipages" ? 64 : view === "icons" ? 32 : 16} />
            {view === "minipages" ? <ItemSummary item={item} /> : <span className={styles.itemTitle}>{item.title}</span>}
            {view === "minipages" && item.description?.trim() && (
              <span className={styles.summaryDescription}>{item.description.trim()}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
