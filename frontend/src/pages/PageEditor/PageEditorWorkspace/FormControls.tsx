import { Button, Checkbox, Input } from "@react95/core";
import type { FieldSpec, Values } from "./pageEditorFields";
import styles from "./PageEditorWorkspace.module.css";

interface FieldInputProps {
  spec: FieldSpec;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}

export function FieldInput({ spec, value, onChange }: FieldInputProps) {
  if (spec.kind === "bool") {
    return (
      <Checkbox checked={value === true} onChange={(e) => onChange(e.target.checked)}>
        {spec.label}
      </Checkbox>
    );
  }

  const text = typeof value === "string" ? value : "";
  return (
    <label className={styles.field}>
      <span>
        {spec.label}
        {spec.required && " *"}
      </span>
      {spec.kind === "textarea" ? (
        <textarea
          className={styles.textarea}
          rows={3}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          style={{ width: "100%" }}
          type={spec.kind === "number" ? "number" : spec.kind === "date" ? "date" : "text"}
          step={spec.kind === "number" ? "any" : undefined}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

interface FieldGroupProps {
  title: string;
  specs: FieldSpec[];
  values: Values;
  onChange: (values: Values) => void;
}

/** One titled group of fields editing a single Values object. */
export function FieldGroup({ title, specs, values, onChange }: FieldGroupProps) {
  return (
    <fieldset className={styles.section}>
      <legend>{title}</legend>
      {specs.length === 0 && <div>No extra fields for this type.</div>}
      {specs.map((s) => (
        <FieldInput
          key={s.key}
          spec={s}
          value={values[s.key]}
          onChange={(v) => onChange({ ...values, [s.key]: v })}
        />
      ))}
    </fieldset>
  );
}

interface RowsEditorProps {
  title: string;
  specs: FieldSpec[];
  rows: Values[];
  onChange: (rows: Values[]) => void;
}

/** Add/remove list of rows, each row edited with the same field specs. */
export function RowsEditor({ title, specs, rows, onChange }: RowsEditorProps) {
  const setCell = (i: number, key: string, v: string | boolean) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <fieldset className={styles.section}>
      <legend>{title}</legend>
      {rows.map((row, i) => (
        <div key={i} className={styles.row}>
          {specs.map((s) => (
            <FieldInput
              key={s.key}
              spec={s}
              value={row[s.key]}
              onChange={(v) => setCell(i, s.key, v)}
            />
          ))}
          <div>
            <Button onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button onClick={() => onChange([...rows, {}])}>Add</Button>
      </div>
    </fieldset>
  );
}