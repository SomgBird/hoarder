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

export function parseUrl(url: string): ExplorerLocation {
  if (url === "collection://home") return { page: "home" };
  const m = url.match(/^collection:\/\/item\/(\d+)$/);
  if (m) return { page: "item", id: Number(m[1]) };
  return { page: "error", kind: "bad-address", url };
}