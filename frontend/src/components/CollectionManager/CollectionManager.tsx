import { useState, useEffect, useId, useRef } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Close, Notepad } from "@react95/icons";
import { Icon } from "@components";
import { ITEM_TYPES, ITEM_TYPE_LABELS, type ItemFilters, type ItemListPage, type ItemOrdering, type ItemType } from "@types";
import { itemService } from "@services";
import CollectionManagerToolbar, { type CollectionItemViewMode } from "./CollectionManagerToolbar";
import CollectionCategories from "./CollectionCategories";
import CollectionItems from "./CollectionItems";
import CollectionFiltersDialog from "./CollectionFiltersDialog";
import styles from "./CollectionManager.module.css";

interface Props {
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
  onOpenItem: (id: number) => void;
  refreshKey?: number;
}

const PAGE_SIZE = 20;
type Result = { key: string; page?: ItemListPage; error?: string };

function CollectionManager({ selectedItemId, onSelectItem, onOpenItem, refreshKey = 0 }: Props) {
  const [view, setView] = useState<CollectionItemViewMode>("table");
  const [folder, setFolder] = useState<"all" | "categories" | ItemType>("all");
  const category = folder === "all" || folder === "categories" ? null : folder;
  const showingFolders = folder === "categories";
  const [ordering, setOrdering] = useState<ItemOrdering>({ sortBy: "title", direction: "asc" });
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const filterId = useId();
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ItemFilters>({});
  const filterActive = category !== null || Object.values(filters).some((value) => value !== undefined && value !== null && value !== "");
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = JSON.stringify([category, filters, offset, ordering.sortBy, ordering.direction, searchQuery, retry, refreshKey]);
  const current = result?.key === requestKey ? result : null;
  const loading = !showingFolders && current === null;
  const page = current?.page;

  useEffect(() => {
    if (showingFolders) return;
    const controller = new AbortController();
    itemService.list(offset, PAGE_SIZE, controller.signal, ordering, category ?? undefined, searchQuery, filters)
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
  }, [offset, ordering, requestKey, category, showingFolders, searchQuery, filters]);

  const showCategories = () => {
    setFolder("categories");
    setOffset(0);
  };

  const applyFilters = (nextCategory: ItemType | null, nextFilters: ItemFilters) => {
    setFolder(nextCategory ?? "all");
    setFilters(nextFilters);
    setOffset(0);
    setFilterVisible(false);
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
        }} ordering={ordering} searchVisible={searchVisible} searchPanelId={`${searchId}-panel`}
          filterVisible={filterVisible} filterActive={filterActive} filterDialogId={filterId}
          onFilter={() => setFilterVisible(true)}
          onSearch={() => setSearchVisible((visible) => !visible)}
          onOrderingChange={(next) => {
            if (next.sortBy === ordering.sortBy && next.direction === ordering.direction) return;
            setOrdering(next);
            setOffset(0);
          }} />
        {searchVisible && <form id={`${searchId}-panel`} role="search" aria-label="Search collection" className={styles.search} onSubmit={(event) => {
          event.preventDefault();
          setSearchQuery(searchDraft.trim());
          setOffset(0);
          setRetry((value) => value + 1);
          if (showingFolders) setFolder("all");
        }}>
          <label htmlFor={searchId}>Search titles</label>
          <input ref={searchInput} id={searchId} type="search" value={searchDraft} autoFocus
            placeholder="Title or alternative title…" onChange={(event) => setSearchDraft(event.target.value)} />
          <Button type="submit">Find</Button>
          <Button type="button" className={styles.clearSearch} aria-label="Clear search" title="Clear search"
            disabled={!searchDraft && !searchQuery} onClick={() => {
            setSearchDraft("");
            setSearchQuery("");
            setOffset(0);
            searchInput.current?.focus();
          }}><Close variant="16x16_4" aria-hidden="true" /></Button>
        </form>}
        {!showingFolders && searchQuery && <p role="status">Results for “{searchQuery}”</p>}
        {!showingFolders && filterActive && <div className={styles.filterSummary}>
          <Button type="button" className={styles.resetFilters} aria-label="Reset filters" title="Reset filters"
            onClick={() => applyFilters(null, {})}><Icon name="refresh_page" size={16} /></Button>
          <p role="status">Filters: {[
          category && ITEM_TYPE_LABELS[category],
          filters.is_owned != null && (filters.is_owned ? "Owned" : "Not owned"),
          filters.release_date_from && `Released from ${filters.release_date_from}`,
          filters.release_date_to && `Released to ${filters.release_date_to}`,
          filters.date_added_from && `Added from ${filters.date_added_from}`,
          filters.date_added_to && `Added to ${filters.date_added_to}`,
          ].filter(Boolean).join(" · ")}</p>
        </div>}
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
              {page?.total === 0 && <p style={{ margin: 4 }}>{searchQuery
                ? `No items match “${searchQuery}”${category ? " in this category" : ""}.`
                : Object.values(filters).some((value) => value != null && value !== "") ? "No items match the selected filters."
                : category ? "No items in this category yet." : "No items yet."}</p>}
              {page && page.total > 0 && (
                <CollectionItems items={page.items} view={view} selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem} onOpenItem={onOpenItem} />
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
      {filterVisible && <CollectionFiltersDialog id={filterId} category={category} filters={filters}
        onDismiss={() => setFilterVisible(false)} onApply={applyFilters} />}
    </>
  );
}

export default CollectionManager;
