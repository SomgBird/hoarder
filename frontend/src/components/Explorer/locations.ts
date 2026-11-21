export type ExplorerLocation =
  | { page: "home" }
  | { page: "item"; id: number }
  | { page: "error"; kind: "bad-address"; url: string };

export function toUrl(loc: ExplorerLocation): string {
  switch (loc.page) {
    case "home": return "collection://home";
    case "item": return `collection://item/${loc.id}`;
    case "error": return loc.url;
  }
}

export function parseItemId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseUrl(url: string): ExplorerLocation {
  const address = url.trim();
  if (address === "collection://home") return { page: "home" };
  const match = /^collection:\/\/item\/(\d+)$/.exec(address);
  const id = parseItemId(match?.[1] ?? null);
  return id === null ? { page: "error", kind: "bad-address", url } : { page: "item", id };
}
