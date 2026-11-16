import { Folder, FolderOpen, HelpBook } from "@react95/icons";
import { getHelpGroup, HELP_GROUPS, HELP_TOPICS, type HelpFolderId, type HelpPage } from "@config/help";
import { HelpLink } from "./HelpLink";
import { HelpTopicIcon } from "./HelpTopicIcon";
import styles from "./Help.module.css";

export function HelpFolder({ folder, standalone, onNavigate }: {
  folder: HelpFolderId;
  standalone: boolean;
  onNavigate: (page: HelpPage) => void;
}) {
  const group = getHelpGroup({ kind: "folder", id: folder });
  const title = group?.label ?? "Hoarder Help";
  const entries = group
    ? group.topics.map((id) => ({ page: { kind: "topic", id } as const, label: HELP_TOPICS[id], icon: <HelpTopicIcon topic={id} /> }))
    : HELP_GROUPS.map(({ id, label }) => ({ page: { kind: "folder", id } as const, label, icon: <Folder variant="16x16_4" /> }));
  return <div className={styles.folderView}>
    <header className={styles.folderSummary}>
      {group ? <FolderOpen variant="32x32_4" /> : <HelpBook variant="32x32_4" />}
      <h1 id="help-topic-title" aria-live="polite">{title}</h1>
      <hr />
      <p>{group?.description ?? "Find help for your collection, item pages, and display settings."}</p>
      <p>Choose {group ? "a topic to read its instructions." : "a folder to view its topics."}</p>
      <small>{entries.length} {group ? "topics" : "folders"}</small>
    </header>
    <ul className={styles.folderEntries} aria-label="Folder contents">
      {entries.map(({ page, label, icon }) => <li key={page.id}>
        <HelpLink page={page} standalone={standalone} onNavigate={onNavigate}>
          <span aria-hidden="true">{icon}</span><span>{label}</span>
        </HelpLink>
      </li>)}
    </ul>
  </div>;
}
