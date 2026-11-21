import { Fieldset } from "@react95/core";
import { DEFAULT_TABLE_COLUMNS, TABLE_COLUMNS, type TableColumn } from "@config/tableColumns";
import styles from "./CollectionManager.module.css";

interface Props {
  columns: TableColumn[];
  onChange: (columns: TableColumn[]) => void;
}

export function TableColumnSettings({ columns, onChange }: Props) {
  return <Fieldset legend="Table columns">
    <div className={styles.columnChoices}>
      {TABLE_COLUMNS.map(({ key, label }) => {
        const checked = columns.includes(key);
        return <label key={key}>
          <input type="checkbox" checked={checked} disabled={checked && columns.length === 1}
            onChange={() => onChange(DEFAULT_TABLE_COLUMNS.filter((column) =>
              column === key ? !checked : columns.includes(column)))} />
          {label}
        </label>;
      })}
    </div>
  </Fieldset>;
}
