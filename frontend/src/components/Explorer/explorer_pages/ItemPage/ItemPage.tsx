import { useEffect, useState } from "react";
import type { Item } from "@types";
import { itemService } from "@services";
import { ErrorPage } from "../ErrorPage";
import ItemView from "./ItemView";

type State =
  | { status: "loading" }
  | { status: "ready"; item: Item }
  | { status: "not-found" }
  | { status: "error"; message: string };

// Assumes itemService throws an error carrying the HTTP status.
const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404;

export function ItemPage({ id }: { id: number }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    itemService
      .get(id)
      .then((item) => {
        if (!cancelled) setState({ status: "ready", item });
      })
      .catch((e) => {
        if (cancelled) return;
        setState(
          isNotFound(e)
            ? { status: "not-found" }
            : { status: "error", message: e.message }
        );
      });

    return () => {
      cancelled = true; // ignore responses for a page we've already left
    };
  }, [id]);

  switch (state.status) {
    case "loading":
      return <p>Loading…</p>;
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
        <ErrorPage heading="Something went wrong" message={state.message} />
      );
    case "ready":
      return <ItemView item={state.item} />;
  }
}