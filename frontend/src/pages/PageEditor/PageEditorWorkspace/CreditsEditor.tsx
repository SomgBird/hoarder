import { useEffect, useState } from "react";
import { referenceService } from "@services";
import { InfoTable } from "./FormControls";
import { CREDIT_FIELDS, type Values } from "./pageEditorFields";
import styles from "./PageEditorWorkspace.module.css";

type Entity = { id: number; name: string };
interface Props {
  kind: "author" | "company";
  rows: Values[];
  onChange: (rows: Values[]) => void;
}

function CreditRow({ kind, row, onChange }: {
  kind: Props["kind"]; row: Values; onChange: (value: Values) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; entities: Entity[]; error?: string } | null>(null);
  const creating = row.reference_mode === "new";
  const selectedId = row[`${kind}_id`];
  const search = query.trim();

  useEffect(() => {
    if (creating || selectedId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const load = kind === "author" ? referenceService.authors : referenceService.companies;
      load(search, controller.signal)
        .then((entities) => {
          if (!controller.signal.aborted) setResult({ query: search, entities });
        })
        .catch((error) => {
          if (!controller.signal.aborted) setResult({ query: search, entities: [], error: error instanceof Error ? error.message : "Search failed." });
        });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [creating, selectedId, kind, search]);

  const label = kind === "author" ? "author" : "company";
  return (
    <>
      <label>
        {kind === "author" ? "Author" : "Company"}
        <select className={styles.input} value={creating ? "new" : "existing"}
          onChange={(event) => onChange({ ...row, reference_mode: event.target.value, [`${kind}_id`]: "", [`${kind}_name`]: "", selected_name: "" })}>
          <option value="existing">Select existing {label}</option>
          <option value="new">Create new {label}</option>
        </select>
      </label>
      {creating ? (
        <label>
          Name *
          <input className={styles.input} value={String(row[`${kind}_name`] ?? "")}
            onChange={(event) => onChange({ ...row, [`${kind}_name`]: event.target.value })} />
          <small>A separate record will be created, even if this name already exists.</small>
        </label>
      ) : selectedId ? (
        <div>
          <span>{row.selected_name} (#{selectedId}) </span>
          <button type="button" onClick={() => onChange({ ...row, [`${kind}_id`]: "", selected_name: "" })}>Change</button>
        </div>
      ) : (
        <div>
          <label>
            Search by name
            <input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {!result || result.query !== search ? <p role="status">Searching…</p>
            : result.error ? <p role="alert">{result.error}</p>
            : result.entities.length === 0 ? <p>No matches. Choose “Create new {label}” to add one.</p>
            : <ul className={styles.credit_results}>
                {result.entities.map((entity) => <li key={entity.id}>
                  <button type="button" onClick={() => onChange({ ...row, [`${kind}_id`]: String(entity.id), selected_name: entity.name })}>
                    {entity.name} (#{entity.id})
                  </button>
                </li>)}
              </ul>}
        </div>
      )}
      <InfoTable specs={CREDIT_FIELDS} values={row} onChange={onChange} />
    </>
  );
}

export function CreditsEditor({ kind, rows, onChange }: Props) {
  return (
    <>
      {rows.map((row, index) => (
        <div key={String(row.row_key)} className={styles.row}>
          <CreditRow kind={kind} row={row} onChange={(next) => onChange(rows.map((value, i) => i === index ? next : value))} />
          <button type="button" className={styles.link_button} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className={styles.button} onClick={() => onChange([...rows, { row_key: crypto.randomUUID(), reference_mode: "existing" }])}>+ Add</button>
    </>
  );
}
