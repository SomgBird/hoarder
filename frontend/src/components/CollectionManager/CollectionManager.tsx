import { useState, useEffect } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Notepad } from "@react95/icons";
import { ITEM_TYPES, ITEM_TYPE_LABELS, type ItemListPage, type ItemOrdering, type ItemType } from "@types";
import { itemService } from "@services";
import CollectionManagerToolbar, { type CollectionItemViewMode } from "./CollectionManagerToolbar";
import CollectionCategories from "./CollectionCategories";
import CollectionItems from "./CollectionItems";
import styles from "./CollectionManager.module.css";

interface Props {
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
  refreshKey?: number;
}

const PAGE_SIZE = 20;
type Result = { key: string; page?: ItemListPage; error?: string };

function CollectionManager({ selectedItemId, onSelectItem, refreshKey = 0 }: Props) {
  const [view, setView] = useState<CollectionItemViewMode>("table");
  const [folder, setFolder] = useState<"all" | "categories" | ItemType>("all");
  const category = folder === "all" || folder === "categories" ? null : folder;
  const showingFolders = folder === "categories";
  const [ordering, setOrdering] = useState<ItemOrdering>({ sortBy: "title", direction: "asc" });
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${category ?? "all"}:${offset}:${ordering.sortBy}:${ordering.direction}:${retry}:${refreshKey}`;
  const current = result?.key === requestKey ? result : null;
  const loading = !showingFolders && current === null;
  const page = current?.page;

  useEffect(() => {
    if (showingFolders) return;
    const controller = new AbortController();
    itemService.list(offset, PAGE_SIZE, controller.signal, ordering, category ?? undefined)
      .then((page) => {
        if (controller.signal.aborted) return;
        if (offset > 0 && offset >= page.total) {
          setOffset(Math.max(0, Math.floor((page.total - 1) / PAGE_SIZE) * PAGE_SIZE));
        } else {
          setResult({ key: requestKey, page });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, error: error instanceof Error ? error.message : "Failed to load collection." });
        }
      });
    return () => controller.abort();
  }, [offset, ordering, requestKey, category, showingFolders]);

  const showCategories = () => {
    setFolder("categories");
    setOffset(0);
  };

  return (
    <>
      <Frame className={styles.manager} bgColor="$material" boxShadow="$out" padding="$3">
        <TitleBar
          title="Collection Manager"
          icon={<Notepad variant="16x16_4" />}
        >
          <TitleBar.OptionsBox>
            <TitleBar.Help />
            <TitleBar.Minimize />
            <TitleBar.Maximize />
            <TitleBar.Close />
          </TitleBar.OptionsBox>
        </TitleBar>
        <CollectionManagerToolbar view={showingFolders ? "categories" : view} onViewChange={(next) => {
          if (next === "categories") {
            showCategories();
          } else {
            setView(next);
            if (showingFolders) setFolder("all");
          }
        }} ordering={ordering}
          onOrderingChange={(next) => {
            if (next.sortBy === ordering.sortBy && next.direction === ordering.direction) return;
            setOrdering(next);
            setOffset(0);
          }} />
        {folder !== "all" && (
          <nav className={styles.breadcrumbs} aria-label="Collection folders">
            <Button onClick={() => {
              setFolder("all");
              setOffset(0);
            }}>All items</Button>
            <span aria-hidden="true">/</span>
            {category === null ? <span aria-current="page">Categories</span> : (
              <>
                <Button onClick={showCategories}>Categories</Button>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{ITEM_TYPE_LABELS[category]}</span>
              </>
            )}
          </nav>
        )}
        <Frame className={styles.content} bgColor="$inputBackground" boxShadow="$in" padding="$2" aria-busy={loading}>
          {showingFolders ? (
            <CollectionCategories ordering={ordering} onOpenCategory={(next) => {
              setFolder(next);
              setOffset(0);
            }} />
          ) : (
            <>
              {loading && <p role="status">Loading collection…</p>}
              {current?.error && <div role="alert">
                <p>{current.error}</p>
                <Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>
              </div>}
              {page?.total === 0 && <p style={{ margin: 4 }}>{category ? "No items in this category yet." : "No items yet."}</p>}
              {page && page.total > 0 && (
                <CollectionItems items={page.items} view={view} selectedItemId={selectedItemId} onSelectItem={onSelectItem} />
              )}
            </>
          )}
        </Frame>
        {showingFolders ? <p role="status">{ITEM_TYPES.length} categories</p> : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <Button disabled={loading || offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>
              Previous
            </Button>
            <span role="status">{page ? page.total === 0 ? "0 items" : `${offset + 1}–${offset + page.items.length} of ${page.total}` : ""}</span>
            <Button disabled={loading || !page || offset + PAGE_SIZE >= page.total} onClick={() => setOffset((value) => value + PAGE_SIZE)}>
              Next
            </Button>
          </div>
        )}
      </Frame>
    </>
  );
}

export default CollectionManager;
