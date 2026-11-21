import { useEffect, useState } from "react";
import type { ItemRead } from "@types";
import { ApiError, itemService } from "@services";
import { ErrorPage } from "../ErrorPage";
import ItemView from "./ItemView";

type Result =
  | { id: number; status: "ready"; item: ItemRead }
  | { id: number; status: "not-found" }
  | { id: number; status: "error"; message: string };

const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

export function ItemPage({ id }: { id: number }) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    itemService
      .get(id, controller.signal)
      .then((item) => {
        if (!controller.signal.aborted) setResult({ id, status: "ready", item });
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setResult(
          isNotFound(e)
            ? { id, status: "not-found" }
            : { id, status: "error", message: e instanceof Error ? e.message : "Could not load this item." },
        );
      });

    return () => controller.abort();
  }, [id]);

  // Loading = no result yet, or the result is for a previous id
  if (!result || result.id !== id) return <p role="status">Loading item…</p>;

  switch (result.status) {
    case "not-found":
      return (
        <ErrorPage
          heading="Item not found"
          message={`There is no item with id ${id} in the collection.`}
          hint="Check the item number or open another item in Collection Manager."
        />
      );
    case "error":
      return (
        <ErrorPage heading="Could not load item" message={result.message} hint="Choose Refresh to try again." />
      );
    case "ready":
      return <ItemView item={result.item} />;
  }
}
