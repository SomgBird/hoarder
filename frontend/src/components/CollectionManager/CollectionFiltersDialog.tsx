import { useEffect, useId, useRef, useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Bookmark } from "@react95/icons";
import { ITEM_TYPE_OPTIONS, type ItemFilters, type ItemType } from "@types";
import styles from "./CollectionFiltersDialog.module.css";

interface Props {
  id: string;
  category: ItemType | null;
  filters: ItemFilters;
  onApply: (category: ItemType | null, filters: ItemFilters) => void;
  onDismiss: () => void;
}

const DATE_FIELDS = [
  { label: "Release date", from: "release_date_from", to: "release_date_to" },
  { label: "Date added", from: "date_added_from", to: "date_added_to" },
] as const;

export default function CollectionFiltersDialog({ id, category, filters, onApply, onDismiss }: Props) {
  const [draftCategory, setDraftCategory] = useState<ItemType | "">(category ?? "");
  const [draft, setDraft] = useState(filters);
  const dialog = useRef<HTMLDivElement>(null);
  const categoryInput = useRef<HTMLSelectElement>(null);
  const [previousFocus] = useState(() => document.activeElement as HTMLElement | null);
  const fieldId = useId();
  const invalidRange = DATE_FIELDS.find(({ from, to }) => draft[from] && draft[to] && draft[from]! > draft[to]!);

  useEffect(() => {
    categoryInput.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [previousFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
      if (event.key === "Tab") {
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [])];
        const first = controls[0];
        const last = controls.at(-1);
        if (!dialog.current?.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div className={styles.overlay}>
      <Frame ref={dialog} id={id} className={styles.dialog} bgColor="$material" boxShadow="$out"
        role="dialog" aria-modal="true" aria-label="Filter collection" aria-describedby={`${fieldId}-hint`}>
        <TitleBar title="Filter collection" icon={<Bookmark variant="16x16_4" />}>
          <TitleBar.OptionsBox>
            <TitleBar.Close aria-label="Close filters" onClick={onDismiss} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          if (!invalidRange) onApply(draftCategory || null, draft);
        }}>
          <p id={`${fieldId}-hint`} className={styles.hint}>Show items matching all selected settings. Leave dates blank for no limit.</p>
          <label className={styles.field} htmlFor={`${fieldId}-category`}>Category
            <select ref={categoryInput} id={`${fieldId}-category`} value={draftCategory}
              onChange={(event) => setDraftCategory(event.target.value as ItemType | "")}>
              <option value="">All categories</option>
              {ITEM_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={styles.field} htmlFor={`${fieldId}-ownership`}>Ownership
            <select id={`${fieldId}-ownership`} value={draft.is_owned == null ? "" : String(draft.is_owned)}
              onChange={(event) => setDraft({ ...draft, is_owned: event.target.value === "" ? undefined : event.target.value === "true" })}>
              <option value="">Any ownership</option>
              <option value="true">Owned</option>
              <option value="false">Not owned</option>
            </select>
          </label>
          {DATE_FIELDS.map(({ label, from, to }) => (
            <fieldset key={from} className={styles.range}>
              <legend>{label}</legend>
              <label className={styles.field} htmlFor={`${fieldId}-${from}`}>From
                <input id={`${fieldId}-${from}`} type="date" aria-label={`${label} from`} value={draft[from] ?? ""}
                  onChange={(event) => setDraft({ ...draft, [from]: event.target.value || undefined })} />
              </label>
              <label className={styles.field} htmlFor={`${fieldId}-${to}`}>To
                <input id={`${fieldId}-${to}`} type="date" aria-label={`${label} to`} value={draft[to] ?? ""}
                  aria-invalid={invalidRange?.to === to || undefined}
                  aria-describedby={invalidRange?.to === to ? `${fieldId}-error` : undefined}
                  onChange={(event) => setDraft({ ...draft, [to]: event.target.value || undefined })} />
              </label>
            </fieldset>
          ))}
          {invalidRange && <p id={`${fieldId}-error`} role="alert" className={styles.error}>
            {invalidRange.label}: end date must be on or after start date.
          </p>}
          <div className={styles.buttons}>
            <Button type="button" onClick={() => onApply(null, {})}>Reset filters</Button>
            <Button type="submit" disabled={!!invalidRange}>Apply</Button>
            <Button type="button" onClick={onDismiss}>Cancel</Button>
          </div>
        </form>
      </Frame>
    </div>
  );
}
