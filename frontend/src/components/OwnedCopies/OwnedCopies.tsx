import type { ReactNode } from "react";
import type { ItemRead, OwnedCopyRead } from "@types";
import styles from "./OwnedCopies.module.css";

interface Props {
  item: ItemRead;
  actions?: (copy: OwnedCopyRead) => ReactNode;
}

export function OwnedCopies({ item, actions }: Props) {
  const copies = item.owned_copies;
  return <section aria-label="Owned copies">
    <h2>Owned copies</h2>
    <p>{copies.length
      ? `Owned through ${copies.length} recorded ${copies.length === 1 ? "copy" : "copies"}.`
      : `${item.is_owned ? "Owned" : "Not owned"}. No copies recorded.`}</p>
    {copies.map((copy) => <article key={copy.id} className={styles.copy} aria-label={`Copy #${copy.id}`}>
      <h3>Copy #{copy.id} · {copy.condition?.condition_type?.name ?? "Ungraded"}</h3>
      {copy.condition?.notes && <p><strong>Condition notes</strong><br />{copy.condition.notes}</p>}
      {copy.notes && <p><strong>Copy notes</strong><br />{copy.notes}</p>}
      {actions?.(copy)}
    </article>)}
  </section>;
}
