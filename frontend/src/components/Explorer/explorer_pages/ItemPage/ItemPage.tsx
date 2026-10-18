import { useEffect, useState } from "react";
import type { ItemRead } from "@types";
import { itemService } from "@services";
import { ErrorPage } from "../ErrorPage";
import ItemView from "./ItemView";

type Result =
  | { id: number; status: "ready"; item: ItemRead }
  | { id: number; status: "not-found" }
  | { id: number; status: "error"; message: string };

const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404;

export function ItemPage({ id }: { id: number }) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;

    itemService
      .get(id)
      .then((item) => {
        if (!cancelled) setResult({ id, status: "ready", item });
      })
      .catch((e) => {
        if (cancelled) return;
        setResult(
          isNotFound(e)
            ? { id, status: "not-found" }
            : { id, status: "error", message: e.message },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Loading = no result yet, or the result is for a previous id
  if (!result || result.id !== id) return <p>Loading…</p>;

  switch (result.status) {
    case "not-found":
      return (
        <ErrorPage
          heading="404 Not Found"
          message={`There is no item with id ${id} in the collection.`}
          hint="Check the address for typos."
        />
      );
    case "error":
      return (
        <ErrorPage heading="Something went wrong" message={result.message} />
      );
    case "ready":
      return <ItemView item={result.item} />;
  }
}
