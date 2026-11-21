import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Tree } from "@react95/core";
import { HelpBook } from "@react95/icons";
import { getHelpGroup, HELP_GROUPS, HELP_TOPICS, isHelpFolder, isHelpTopic, type HelpPage } from "@config/help";
import { HelpTopicIcon } from "./HelpTopicIcon";

const folderLabel = (node: Element) => node.querySelector<HTMLElement>(":scope > div > label");
const folderChildren = (node: Element) => node.querySelector(":scope > ul");
const toggleFolder = (node: Element) => folderLabel(node)?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

export function HelpContents({ page, onSelect }: { page: HelpPage; onSelect: (page: HelpPage) => void }) {
  const contents = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const tree = contents.current;
    if (!tree || page.kind !== "topic") return;
    // React95 owns folder expansion but exposes no controlled/default-open prop.
    // Use its label toggle action to reveal contextual links and history entries.
    const group = getHelpGroup(page);
    const folder = tree.querySelector(`[data-help-folder="${group?.id}"]`);
    if (folder && !folderChildren(folder)) toggleFolder(folder);
  }, [page]);

  useLayoutEffect(() => {
    const tree = contents.current;
    if (!tree) return;
    const updateExpanded = () => {
      tree.querySelectorAll("[data-help-folder]").forEach((folder) => {
        const children = folderChildren(folder);
        const expanded = String(children !== null);
        if (folder.getAttribute("aria-expanded") !== expanded) folder.setAttribute("aria-expanded", expanded);
        if (children?.getAttribute("role") !== "group") children?.setAttribute("role", "group");
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
        const folder = node.getAttribute("data-help-folder");
        if (isHelpTopic(selected)) onSelect({ kind: "topic", id: selected });
        else if (isHelpFolder(folder)) onSelect({ kind: "folder", id: folder });
        else onSelect({ kind: "folder", id: "root" });
      } else if (event.key === "ArrowRight" && node.hasAttribute("data-help-folder")) {
        if (!folderChildren(node)) toggleFolder(node);
        else folderChildren(node)?.querySelector<HTMLElement>("label")?.focus();
      } else if (event.key === "ArrowRight" && node.hasAttribute("data-help-root")) {
        labels[1]?.focus();
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
    role: "treeitem", "aria-level": 1, "aria-expanded": true, "aria-owns": "help-folder-tree",
    "aria-selected": page.kind === "folder" && page.id === "root",
    "data-help-root": true, onClick: () => onSelect({ kind: "folder", id: "root" }) };

  return (
    <div ref={contents} role="tree" aria-label="Help topics" onKeyDownCapture={onKeyDown}>
      <Tree id="help-folder-tree" role="group" root={rootNode} data={HELP_GROUPS.map((group, groupIndex) => ({
        id: groupIndex + 1, label: group.label, role: "treeitem", "aria-level": 2, "data-help-folder": group.id,
        "aria-selected": page.kind === "folder" && page.id === group.id,
        onClick: () => onSelect({ kind: "folder", id: group.id }),
        children: group.topics.map((key, index) => ({
          id: (groupIndex + 1) * 100 + index, label: HELP_TOPICS[key],
          icon: <HelpTopicIcon topic={key} />, role: "treeitem", "aria-level": 3,
          "aria-selected": page.kind === "topic" && page.id === key, "data-help-topic": key,
          onClick: () => onSelect({ kind: "topic", id: key }),
        })),
      }))} />
    </div>
  );
}
