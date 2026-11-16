import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Tree } from "@react95/core";
import {
  Bookmark, HelpBook, Icwdial101, Ie, Inetcpl1319, Mshtml32541, Mspaint,
  RecycleEmpty, Settings, Wangimg128, Winhlp324000,
} from "@react95/icons";
import { HELP_TOPICS, isHelpTopic, type HelpTopicId } from "@config/help";

const groups: { id: string; label: string; topics: HelpTopicId[] }[] = [
  { id: "getting-started", label: "Getting started", topics: ["welcome", "about", "confirmations"] },
  { id: "collection", label: "Collection", topics: ["collection", "filters", "explorer"] },
  { id: "item-pages", label: "Item pages", topics: ["new-item", "edit-item", "images", "delete-item"] },
  { id: "media", label: "Media", topics: ["media", "image-viewer"] },
  { id: "appearance", label: "Appearance", topics: ["settings", "color-picker"] },
];

const topicIcons = {
  welcome: HelpBook, collection: Inetcpl1319, filters: Bookmark, explorer: Ie,
  "new-item": Mshtml32541, "edit-item": Mshtml32541, images: Wangimg128,
  "delete-item": RecycleEmpty, media: Wangimg128, "image-viewer": Wangimg128,
  settings: Settings, "color-picker": Mspaint, confirmations: Icwdial101, about: Winhlp324000,
};

const folderLabel = (node: Element) => node.querySelector<HTMLElement>(":scope > div > label");
const folderChildren = (node: Element) => node.querySelector(":scope > ul");
const toggleFolder = (node: Element) => folderLabel(node)?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

export function HelpContents({ topic, onSelect }: { topic: HelpTopicId; onSelect: (topic: HelpTopicId) => void }) {
  const contents = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const tree = contents.current;
    if (!tree) return;
    // React95 owns folder expansion but exposes no controlled/default-open prop.
    // Use its label toggle action to reveal contextual links and history entries.
    const group = groups.find(({ topics }) => topics.includes(topic));
    const folder = tree.querySelector(`[data-help-folder="${group?.id}"]`);
    if (folder && !folderChildren(folder)) toggleFolder(folder);
  }, [topic]);

  useLayoutEffect(() => {
    const tree = contents.current;
    if (!tree) return;
    const updateExpanded = () => {
      tree.querySelectorAll("[data-help-folder]").forEach((folder) => {
        const children = folderChildren(folder);
        folder.setAttribute("aria-expanded", String(children !== null));
        children?.setAttribute("role", "group");
      });
    };
    // Keep accessibility state aligned with React95's mouse/keyboard toggles.
    const observer = new window.MutationObserver(updateExpanded);
    observer.observe(tree, { childList: true, subtree: true });
    updateExpanded();
    return () => observer.disconnect();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const node = (event.target as HTMLElement).closest('[role="treeitem"]');
    const labels = [...(contents.current?.querySelectorAll<HTMLElement>("label[tabindex]") ?? [])];
    const index = labels.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? Math.min(index + 1, labels.length - 1)
      : event.key === "ArrowUp" ? Math.max(index - 1, 0)
        : event.key === "Home" ? 0 : event.key === "End" ? labels.length - 1 : null;
    if (next !== null) {
      event.preventDefault();
      event.stopPropagation();
      labels[next]?.focus();
    } else if (node && ["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") {
        const selected = node.getAttribute("data-help-topic");
        if (isHelpTopic(selected)) onSelect(selected);
        else if (node.hasAttribute("data-help-folder")) toggleFolder(node);
        else onSelect("welcome");
      } else if (event.key === "ArrowRight" && node.hasAttribute("data-help-folder")) {
        if (!folderChildren(node)) toggleFolder(node);
        else folderChildren(node)?.querySelector<HTMLElement>("label")?.focus();
      } else if (event.key === "ArrowLeft") {
        if (node.hasAttribute("data-help-folder") && folderChildren(node)) toggleFolder(node);
        else {
          const parent = node.parentElement?.closest("[data-help-folder]");
          if (parent) folderLabel(parent)?.focus();
          else labels[0]?.focus();
        }
      }
    }
  };

  const rootNode = { id: 0, label: "Hoarder Help", icon: <HelpBook variant="16x16_4" />,
    role: "treeitem", "aria-level": 1, onClick: () => onSelect("welcome") };

  return (
    <div ref={contents} role="tree" aria-label="Help topics" onKeyDownCapture={onKeyDown}>
      <Tree role="group" root={rootNode} data={groups.map((group, groupIndex) => ({
        id: groupIndex + 1, label: group.label, role: "treeitem", "aria-level": 1, "data-help-folder": group.id,
        children: group.topics.map((key, index) => {
          const Icon = topicIcons[key];
          return { id: (groupIndex + 1) * 100 + index, label: HELP_TOPICS[key],
            icon: <Icon variant="32x32_4" width={16} height={16} />, role: "treeitem", "aria-level": 2,
            "aria-selected": topic === key, "data-help-topic": key, onClick: () => onSelect(key) };
        }),
      }))} />
    </div>
  );
}
