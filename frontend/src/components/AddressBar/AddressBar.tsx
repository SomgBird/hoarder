import { useId, type ChangeEvent, type KeyboardEvent } from "react";
import { Dropdown } from "@react95/core";
import styles from "./AddressBar.module.css";
import Separator from "@components/Separator";

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
  const inputId = useId();
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
    <div className={styles.container}>
      <Separator orientation="vertical" variant="grip" />
      <div className={styles.wrapper}>
        <label className={styles.label} htmlFor={inputId}>{label}</label>
        <div className={styles.fieldGroup}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            id={inputId}
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
    </div>
  );
}

export default AddressBar;
