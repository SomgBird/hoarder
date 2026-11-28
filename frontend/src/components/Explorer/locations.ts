export const RECORD_PAGES = ["item", "article", "franchise"] as const;
export type RecordPage = (typeof RECORD_PAGES)[number];

export type ExplorerLocation =
  | { page: "home" }
  | { page: "pages" }
  | { page: RecordPage; id: number }
  | { page: "error"; kind: "bad-address"; url: string };

export function toUrl(loc: ExplorerLocation): string {
  switch (loc.page) {
    case "home": return "collection://home";
    case "pages": return "collection://pages";
    case "item": case "article": case "franchise": return `collection://${loc.page}/${loc.id}`;
    case "error": return loc.url;
  }
}

export function collectionPath(loc: ExplorerLocation): string {
  switch (loc.page) {
    case "home": return "/collection-view";
    case "pages": return "/collection-view?page=pages";
    case "item": case "article": case "franchise": return `/collection-view?${loc.page}Id=${loc.id}`;
    case "error": return `/collection-view?${new URLSearchParams({ address: loc.url })}`;
  }
}

export function parseRecordId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function pageEditorPath(loc: ExplorerLocation): string | null {
  return "id" in loc ? `/page-editor?${loc.page}Id=${loc.id}` : null;
}

export function parseUrl(url: string): ExplorerLocation {
  const address = url.trim();
  if (address === "collection://home") return { page: "home" };
  if (address === "collection://pages") return { page: "pages" };
  const match = /^collection:\/\/([a-z]+)\/(\d+)$/.exec(address);
  const page = RECORD_PAGES.find((kind) => kind === match?.[1]);
  const id = parseRecordId(match?.[2] ?? null);
  if (!page || id === null) return { page: "error", kind: "bad-address", url };
  return { page, id };
}
