import { Frame } from "@react95/core";
import { FileText } from "@react95/icons";
import type { KeyboardEvent, ReactNode } from "react";
import type { OwnedCopyRead } from "@types";
import styles from "./CopyEditor.module.css";

interface Props {
  copies: OwnedCopyRead[];
  selected?: OwnedCopyRead;
  onSelect: (id: number) => void;
  onEdit: (copy: OwnedCopyRead) => void;
  emptyMessage: ReactNode;
}

export function CopyList({ copies, selected, onSelect, onEdit, emptyMessage }: Props) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter") {
      event.preventDefault();
      onEdit(copies[index]);
      return;
    }
    const next = { ArrowDown: Math.min(index + 1, copies.length - 1), ArrowUp: Math.max(0, index - 1),
      Home: 0, End: copies.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(copies[next].id);
    event.currentTarget.closest("tbody")?.rows[next].querySelector("button")?.focus();
  }

  return <Frame bgColor="$inputBackground" boxShadow="$in" className={styles.list}>
    <table aria-label="Owned copies">
      <thead><tr><th scope="col">Copy</th><th scope="col">Condition</th><th scope="col">Photos</th><th scope="col">Copy notes</th></tr></thead>
      <tbody>{copies.map((copy, index) => <tr key={copy.id} data-selected={selected?.id === copy.id}
        onClick={(event) => { onSelect(copy.id); event.currentTarget.querySelector("button")?.focus(); }}
        onDoubleClick={() => onEdit(copy)}>
        <td><button type="button" aria-pressed={selected?.id === copy.id} tabIndex={selected?.id === copy.id ? 0 : -1}
          onKeyDown={(event) => navigate(event, index)}>
          <FileText variant="16x16_4" aria-hidden="true" />Copy #{copy.id}
        </button></td>
        <td>{copy.condition?.condition_type?.name ?? "Ungraded"}</td>
        <td>{copy.photos.length}</td>
        <td title={copy.notes || undefined}>{copy.notes || "—"}</td>
      </tr>)}</tbody>
    </table>
    {!copies.length && <div className={styles.empty}>{emptyMessage}</div>}
  </Frame>;
}
