import { Button, Input } from "@react95/core";
import { useEffect, useState } from "react";
import { referenceService } from "@services/referenceService";
import type { FranchiseRead } from "@types";
import type { StepProps } from "./PageEditorWizardSteps";
import styles from "./PageEditorWizard.module.css";

export function FranchiseStep({ data, update }: StepProps) {
  const [franchises, setFranchises] = useState<FranchiseRead[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    referenceService.list("franchises", undefined, controller.signal).then((list) => {
      if (!controller.signal.aborted) setFranchises(list.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id));
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Request failed.");
    });
    return () => controller.abort();
  }, [attempt]);

  if (error) return <>
    <p role="alert">Could not load franchises. {error}</p>
    <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>
  </>;
  if (franchises === null) return <p role="status">Loading franchises…</p>;
  if (franchises.length === 0) return <p>No franchises in the collection yet. Add one in an item's Catalog tab first.</p>;

  const search = query.trim().toLocaleLowerCase();
  const matches = franchises.filter((franchise) => franchise.name.toLocaleLowerCase().includes(search));
  const selected = franchises.find(({ id }) => id === data.franchise?.id);
  const options = selected && !matches.includes(selected) ? [selected, ...matches] : matches;
  return <div className={styles.fields}>
    <label htmlFor="franchise-search">Search franchises</label>
    <Input id="franchise-search" type="search" autoFocus value={query} aria-controls="franchise-choice"
      onChange={(event) => setQuery(event.target.value)} />
    <label htmlFor="franchise-choice">Franchise</label>
    <select id="franchise-choice" size={5} className={styles.franchiseSelect} value={data.franchise?.id ?? ""}
      onChange={(event) => update({ franchise: franchises.find(({ id }) => id === Number(event.target.value)) ?? null })}>
      <option value="" hidden />
      {options.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
    </select>
    {matches.length === 0 && <p role="status">No matching franchises.</p>}
  </div>;
}
