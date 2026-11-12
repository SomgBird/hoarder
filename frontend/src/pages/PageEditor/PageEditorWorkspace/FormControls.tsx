import type { ReactNode } from "react";
import type { FieldSpec, Values } from "./pageEditorFields";
import { ReferencePicker } from "./ReferencePicker";
import styles from "./PageEditorWorkspace.module.css";

type Cell = Values[string] | undefined;

interface FieldInputProps {
  spec: FieldSpec;
  value: Cell;
  onChange: (value: Values[string]) => void;
}

/** One native control, chosen by the spec's kind. The label comes from the surrounding table. */
export function FieldInput({ spec, value, onChange }: FieldInputProps) {
  if (spec.kind === "reference" && spec.reference) {
    return <ReferencePicker resource={spec.reference} label={spec.label} multiple={spec.multiple}
      value={typeof value === "string" || Array.isArray(value) ? value : ""} onChange={onChange} />;
  }
  if (spec.kind === "bool") {
    return (
      <input
        type="checkbox"
        aria-label={spec.label}
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }

  const text = typeof value === "string" ? value : "";

  if (spec.kind === "textarea") {
    return (
      <textarea
        className={styles.textarea}
        aria-label={spec.label}
        rows={6}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      className={styles.input}
      aria-label={spec.label}
      type={spec.kind === "number" ? "number" : spec.kind === "date" ? "date" : "text"}
      step={spec.kind === "number" ? "any" : undefined}
      value={text}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** The page's section box: light panel with a heading, like the view page. */
export function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.box}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

interface InfoTableProps {
  specs: FieldSpec[];
  values: Values;
  onChange: (values: Values) => void;
  children?: ReactNode; // extra <tr> rows rendered first (e.g. the type selector)
}

/** "Label: [value]" rows, like the Info box on the view page. */
export function InfoTable({ specs, values, onChange, children }: InfoTableProps) {
  return (
    <table className={styles.info}>
      <tbody>
        {children}
        {specs.map((s) => (
          <tr key={s.key}>
            <th scope="row">
              {s.label}
              {s.required && " *"}:
            </th>
            <td>
              <FieldInput
                spec={s}
                value={values[s.key]}
                onChange={(v) => onChange({ ...values, [s.key]: v })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface RowsEditorProps {
  specs: FieldSpec[];
  rows: Values[];
  onChange: (rows: Values[]) => void;
}

/** Add/remove list; each row is a small info table. The caller supplies the Box around it. */
export function RowsEditor({ specs, rows, onChange }: RowsEditorProps) {
  const setRow = (i: number, next: Values) =>
    onChange(rows.map((r, idx) => (idx === i ? next : r)));

  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className={styles.row}>
          <InfoTable specs={specs} values={row} onChange={(next) => setRow(i, next)} />
          <button
            type="button"
            className={styles.link_button}
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.button} onClick={() => onChange([...rows, {}])}>
        + Add
      </button>
    </>
  );
}
