export type ExplorerLocation =
  | { page: "home" }
  | { page: "item"; id: number }
  | { page: "article"; id: number }
  | { page: "error"; kind: "bad-address"; url: string };

export function toUrl(loc: ExplorerLocation): string {
  switch (loc.page) {
    case "home": return "collection://home";
    case "item": return `collection://item/${loc.id}`;
    case "article": return `collection://article/${loc.id}`;
    case "error": return loc.url;
  }
}

export function parseRecordId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function pageEditorPath(loc: ExplorerLocation): string | null {
  return loc.page === "item" || loc.page === "article" ? `/page-editor?${loc.page}Id=${loc.id}` : null;
}

export function parseUrl(url: string): ExplorerLocation {
  const address = url.trim();
  if (address === "collection://home") return { page: "home" };
  const match = /^collection:\/\/(item|article)\/(\d+)$/.exec(address);
  const id = parseRecordId(match?.[2] ?? null);
  if (!match || id === null) return { page: "error", kind: "bad-address", url };
  return { page: match[1] === "article" ? "article" : "item", id };
}
