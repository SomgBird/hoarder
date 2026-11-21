import { useState, type KeyboardEvent } from "react";
import { FileText } from "@react95/icons";
import { ITEM_TYPES, ITEM_TYPE_LABELS, type ItemListEntryRead } from "@types";
import { coverUrl } from "@services";
import type { CollectionItemViewMode } from "./CollectionManagerToolbar";
import { TABLE_COLUMNS, type TableColumn } from "@config/tableColumns";
import styles from "./CollectionManager.module.css";

interface Props {
  items: ItemListEntryRead[];
  view: CollectionItemViewMode;
  columns: TableColumn[];
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
  onOpenItem: (id: number) => void;
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

function tableValue(item: ItemListEntryRead, column: TableColumn) {
  if (column === "title") return item.title;
  if (column === "owned_copy_count") return item.owned_copy_count || "-";
  return <ItemDate value={item[column]} />;
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
        <span aria-hidden="true"> · </span>
        <span className={styles.copyCount}>Copies: {item.owned_copy_count || "-"}</span>
      </span>
      <span className={styles.summaryDetails}>
        <span>Release date: <ItemDate value={item.release_date} /></span>
        <span>Date added: <ItemDate value={item.date_added} /></span>
      </span>
    </span>
  );
}

export default function CollectionItems({ items, view, columns, selectedItemId, onSelectItem, onOpenItem }: Props) {
  const openItem = (id: number) => {
    onSelectItem(id);
    onOpenItem(id);
  };
  const openOnEnter = (event: KeyboardEvent<HTMLButtonElement>, id: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openItem(id);
    }
  };
  if (view === "table") {
    const visibleColumns = TABLE_COLUMNS.filter(({ key }) => columns.includes(key));
    return (
      <table className={styles.table} aria-label="Collection items">
        <thead>
          <tr>{visibleColumns.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} data-selected={item.id === selectedItemId} onClick={() => onSelectItem(item.id)}
              onDoubleClick={() => openItem(item.id)}>
              {visibleColumns.map(({ key, label }, index) => <td key={key} className={key === "title" ? styles.titleCell : undefined}>
                {index === 0 ? <button type="button" className={styles.tableTitle} aria-current={item.id === selectedItemId}
                  aria-label={key === "title" ? undefined : `${item.title}, ${label}: ${item[key] ?? "—"}`} title={item.title}
                  onClick={(event) => { event.stopPropagation(); onSelectItem(item.id); }}
                  onKeyDown={(event) => openOnEnter(event, item.id)}>
                  {tableValue(item, key)}
                </button> : tableValue(item, key)}
              </td>)}
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
            onClick={() => onSelectItem(item.id)} onDoubleClick={() => openItem(item.id)}
            onKeyDown={(event) => openOnEnter(event, item.id)} title={item.title}>
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
