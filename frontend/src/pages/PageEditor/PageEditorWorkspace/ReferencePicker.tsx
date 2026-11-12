import { useContext, useState } from "react";
import type { ReferenceResource } from "../../../services/referenceService";
import { ReferenceContext } from "./referenceData";
import styles from "./PageEditorWorkspace.module.css";

interface Props {
  resource: ReferenceResource;
  label: string;
  value: string | string[];
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
}

export function ReferencePicker({ resource, label, value, multiple, onChange }: Props) {
  const data = useContext(ReferenceContext);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  if (!data) throw new Error("ReferencePicker requires reference data.");
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const options = data.options[resource];
  const search = query.trim().toLocaleLowerCase();
  const visible = options.filter((entry) => (entry.label.toLocaleLowerCase().includes(search)
    || selected.includes(entry.value)) && (!multiple || !selected.includes(entry.value)));

  const choose = (next: string) => {
    onChange(multiple ? [...new Set([...selected, next])] : next);
    setQuery("");
  };
  const add = async () => {
    if (resource === "languages" || !name.trim()) return;
    setError("");
    try {
      const added = await data.create(resource, name.trim());
      choose(added.value);
      setName("");
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add entry.");
    }
  };

  return (
    <div className={styles.reference_picker}>
      {multiple && selected.length > 0 && <ul className={styles.selected_references}>
        {selected.map((entry) => <li key={entry}>
          <span>{options.find((o) => o.value === entry)?.label ?? "Selected entry"}</span>
          <button type="button" aria-label={`Remove ${options.find((o) => o.value === entry)?.label ?? label}`}
            onClick={() => onChange(selected.filter((v) => v !== entry))}>×</button>
        </li>)}
      </ul>}
      <input type="search" className={styles.input} aria-label={`Search ${label.toLowerCase()}`}
        placeholder={`Find ${label.toLowerCase()}…`} value={query} disabled={data.loading || !!data.error}
        onChange={(e) => setQuery(e.target.value)} />
      <select className={styles.input} aria-label={label} value={multiple ? "" : selected[0] ?? ""}
        disabled={data.loading || !!data.error}
        onChange={(e) => { if (e.target.value || !multiple) choose(e.target.value); }}>
        <option value="">{data.loading ? "Loading…" : multiple ? `Choose ${label.toLowerCase()}…` : "— None selected —"}</option>
        {visible.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
      </select>
      {!data.loading && !data.error && visible.length === 0 && <small>No matching entries.</small>}
      {resource !== "languages" && !adding && <button type="button" className={styles.link_button}
        disabled={data.loading || !!data.error} onClick={() => { setAdding(true); setName(query); setError(""); }}>
        + Add new
      </button>}
      {adding && <div className={styles.new_reference}>
        <label>New {label.toLowerCase()}
          <input className={styles.input} aria-label={`New ${label.toLowerCase()}`} value={name}
            onChange={(e) => setName(e.target.value)} />
        </label>
        <div className={styles.inline_actions}>
          <button type="button" className={styles.button} disabled={!name.trim() || data.pending > 0} onClick={add}>Add and select</button>
          <button type="button" className={styles.link_button} onClick={() => { setAdding(false); setError(""); }}>Cancel</button>
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>}
    </div>
  );
}
