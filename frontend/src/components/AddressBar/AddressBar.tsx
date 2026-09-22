import type { ChangeEvent, KeyboardEvent } from "react";
import { Dropdown } from "@react95/core";
import styles from "./AddressBar.module.css";

interface AddressBarProps {
  value: string;
  history?: string[];
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  label?: string;
  icon?: React.ReactNode;
}

function AddressBar({
  value,
  history = [],
  onChange,
  onSubmit,
  label = "Address",
  icon,
}: AddressBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit?.(value);
  };

  const handleHistorySelect = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
    onSubmit?.(e.target.value);
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.fieldGroup}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {history.length > 0 && (
          <Dropdown
            className={styles.historyDropdown}
            options={history}
            value=""
            onChange={handleHistorySelect}
            aria-label="Address history"
          />
        )}
      </div>
    </div>
  );
}

export default AddressBar;
