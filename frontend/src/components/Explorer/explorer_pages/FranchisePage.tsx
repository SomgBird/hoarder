import { useEffect, useState } from "react";
import { franchisePageService, type FranchisePageRead } from "@services/franchisePageService";
import { ApiError } from "@services/client";
import { ITEM_TYPE_LABELS, ITEM_TYPES } from "@types";
import { ExplorerLink } from "../ExplorerLink";
import { ErrorPage } from "./ErrorPage";
import styles from "./ExplorerMessage.module.css";

export function FranchisePage({ id }: { id: number }) {
  const [franchise, setFranchise] = useState<FranchisePageRead | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    franchisePageService.get(id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setFranchise(result);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause : new Error("Request failed."));
    });
    return () => controller.abort();
  }, [id]);

  if (error instanceof ApiError && error.status === 404) {
    return <ErrorPage heading="Franchise not found" message={`There is no franchise with id ${id} in the collection.`}
      hint="Check the franchise number in the address." />;
  }
  if (error) return <ErrorPage heading="Could not load franchise" message={error.message} hint="Choose Refresh to try again." />;
  if (!franchise) return <p role="status">Loading franchise…</p>;
  return <article className={styles.article}>
    <h1>{franchise.title}</h1>
    {franchise.introduction && <p>{franchise.introduction}</p>}
    <h2>Collection items</h2>
    {franchise.members.length === 0 ? <p>No items are assigned to this franchise.</p>
      : <ul>{franchise.members.map((member) => {
        const type = ITEM_TYPES.find((value) => value === member.item_type);
        return <li key={member.id}>
          <ExplorerLink to={{ page: "item", id: member.id }}>{member.title}</ExplorerLink>
          {` (${type ? ITEM_TYPE_LABELS[type] : member.item_type})`}
        </li>;
      })}</ul>}
  </article>;
}
