export const HELP_TOPICS = {
  welcome: "Welcome to Hoarder",
  collection: "Collection Manager",
  filters: "Searching and filtering",
  explorer: "Browsing item pages",
  copies: "Copy Editor",
  "new-item": "Creating an item",
  "edit-item": "Editing an item",
  images: "Covers and icons",
  "delete-item": "Deleting an item",
  media: "Media Viewer",
  "image-viewer": "Viewing an image",
  settings: "Display Properties",
  "color-picker": "Choosing a color",
  confirmations: "Confirmation dialogs",
  about: "About Hoarder",
} as const;

export type HelpTopicId = keyof typeof HELP_TOPICS;

export const HELP_GROUPS = [
  {
    id: "getting-started", label: "Getting started",
    description: "Learn your way around Hoarder and its windows.",
    topics: ["welcome", "about", "confirmations"],
  },
  {
    id: "collection", label: "Collection",
    description: "Browse, search, and organize the items in your collection.",
    topics: ["collection", "filters", "explorer", "copies"],
  },
  {
    id: "item-pages", label: "Item pages",
    description: "Create and edit item pages, add images, and manage your items.",
    topics: ["new-item", "edit-item", "images", "delete-item"],
  },
  {
    id: "media", label: "Media",
    description: "Browse uploaded files and view their original images.",
    topics: ["media", "image-viewer"],
  },
  {
    id: "appearance", label: "Appearance",
    description: "Personalize your desktop background and window colors.",
    topics: ["settings", "color-picker"],
  },
] as const satisfies readonly { id: string; label: string; description: string; topics: readonly HelpTopicId[] }[];

export type HelpGroupId = (typeof HELP_GROUPS)[number]["id"];
export type HelpFolderId = "root" | HelpGroupId;
export type HelpPage = { kind: "topic"; id: HelpTopicId } | { kind: "folder"; id: HelpFolderId };

export const HELP_ROOT = { kind: "folder", id: "root" } as const satisfies HelpPage;

export function isHelpFolder(value: unknown): value is HelpFolderId {
  return value === "root" || HELP_GROUPS.some(({ id }) => id === value);
}

export function isHelpPage(value: unknown): value is HelpPage {
  if (!value || typeof value !== "object") return false;
  const page = value as Record<string, unknown>;
  return page.kind === "topic" ? isHelpTopic(page.id) : page.kind === "folder" && isHelpFolder(page.id);
}

export function getHelpGroup(page: HelpPage) {
  return HELP_GROUPS.find((group) => page.kind === "folder"
    ? group.id === page.id : group.topics.some((topic) => topic === page.id));
}

export function isHelpTopic(value: unknown): value is HelpTopicId {
  return typeof value === "string" && Object.hasOwn(HELP_TOPICS, value);
}

export function helpUrl(topic: HelpTopicId = "welcome", standalone = false) {
  return `/help?topic=${topic}${standalone ? "&window=1" : ""}`;
}

export function helpPageUrl(page: HelpPage, standalone = false) {
  return page.kind === "topic" ? helpUrl(page.id, standalone)
    : `/help?folder=${encodeURIComponent(page.id)}${standalone ? "&window=1" : ""}`;
}

export function openHelp(topic: HelpTopicId) {
  window.open(helpUrl(topic, true), "hoarder-help");
}
