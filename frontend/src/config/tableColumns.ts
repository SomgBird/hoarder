export const TABLE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "release_date", label: "Release date" },
  { key: "date_added", label: "Date added" },
  { key: "owned_copy_count", label: "Owned copies" },
] as const;

export type TableColumn = typeof TABLE_COLUMNS[number]["key"];
export const DEFAULT_TABLE_COLUMNS = TABLE_COLUMNS.map(({ key }) => key);
const storageKey = "hoarder.collection.tableColumns";
let sessionColumns: TableColumn[] | undefined;

export function readTableColumns(): TableColumn[] {
  if (sessionColumns) return sessionColumns;
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(stored)) {
      const columns = DEFAULT_TABLE_COLUMNS.filter((key) => stored.includes(key));
      if (columns.length) return columns;
    }
  } catch {
    // Use the defaults if storage is unavailable or a preference is unreadable.
  }
  return DEFAULT_TABLE_COLUMNS;
}

export function saveTableColumns(columns: TableColumn[]): boolean {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(columns));
    sessionColumns = undefined;
    return true;
  } catch {
    sessionColumns = columns;
    return false;
  }
}
