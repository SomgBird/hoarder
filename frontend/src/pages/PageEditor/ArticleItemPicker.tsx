import { Button, Input } from "@react95/core";
import { useEffect, useState } from "react";
import { itemService } from "@services";
import type { ItemListPage } from "@types";
import styles from "./PageEditorWorkspace/PageEditorWorkspace.module.css";

export interface LinkTarget {
  id: number;
  title: string | null;
}

const PAGE_SIZE = 10;

export function ArticleItemPicker({ onChoose, onCancel }: {
  onChoose: (target: LinkTarget) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ query: string; offset: number; page?: ItemListPage; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const page = await itemService.list(offset, PAGE_SIZE, controller.signal, { sortBy: "title", direction: "asc" }, undefined, query);
        if (!controller.signal.aborted) setResult({ query, offset, page });
      } catch (cause) {
        if (!controller.signal.aborted) setResult({ query, offset, error: cause instanceof Error ? cause.message : "Search failed." });
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, offset, attempt]);
  const current = result?.query === query && result.offset === offset ? result : undefined;
  const page = current?.page;

  return <div>
    <label htmlFor="article-item-search">Search by item title</label>
    <Input id="article-item-search" autoFocus value={query}
      onChange={(event) => { setQuery(event.target.value); setOffset(0); }} />
    {!current && <p role="status">Searching…</p>}
    {current?.error && <p role="alert">{current.error} <Button type="button"
      onClick={() => { setResult(undefined); setAttempt((n) => n + 1); }}>Retry</Button></p>}
    {page && (page.items.length ? <ul aria-label="Matching items" className={styles.credit_results}>
      {page.items.map(({ id, title }) => <li key={id}>
        <button type="button" onClick={() => onChoose({ id, title })}>{title} (#{id})</button>
      </li>)}
    </ul> : <p role="status">No matching items.</p>)}
    {page && page.total > PAGE_SIZE && <div className={styles.inline_actions}>
      <Button type="button" disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}>Previous</Button>
      <Button type="button" disabled={offset + PAGE_SIZE >= page.total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</Button>
    </div>}
    <Button type="button" onClick={onCancel}>Cancel selection</Button>
  </div>;
}
