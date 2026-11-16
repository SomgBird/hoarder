export const HELP_TOPICS = {
  welcome: "Welcome to Hoarder",
  collection: "Collection Manager",
  filters: "Searching and filtering",
  explorer: "Browsing item pages",
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

export function isHelpTopic(value: unknown): value is HelpTopicId {
  return typeof value === "string" && Object.hasOwn(HELP_TOPICS, value);
}

export function helpUrl(topic: HelpTopicId = "welcome", standalone = false) {
  return `/help?topic=${topic}${standalone ? "&window=1" : ""}`;
}

export function openHelp(topic: HelpTopicId) {
  window.open(helpUrl(topic, true), "hoarder-help");
}
