import type { KeyboardEvent } from "react";
import { Toolbar } from "@components";
import {
  Bookmark,
  Detlicon,
  Explorer101,
  Files,
  FolderExe,
  FolderFile,
  Mailnews20,
  Shdocvw272,
} from "@react95/icons";

export type CollectionViewMode = "table" | "list" | "icons";

interface Props {
  view: CollectionViewMode;
  onViewChange: (view: CollectionViewMode) => void;
}

function CollectionManagerToolbar({ view, onViewChange }: Props) {
  const views = [
    { value: "table", label: "Table", icon: <Detlicon variant="16x16_4" /> },
    { value: "list", label: "List", icon: <FolderFile variant="16x16_4" /> },
    { value: "icons", label: "Icons", icon: <Shdocvw272 variant="16x16_4" /> },
  ] as const;

  return (
    <Toolbar>
      <Toolbar.Button icon={<Explorer101 variant="32x32_4" />} label="Search" />
      <Toolbar.Button icon={<Bookmark variant="32x32_4" />} label="Filter" />

      <Toolbar.Menu icon={<Files variant="32x32_4" />} label="Order">
        <Toolbar.MenuItem>Title</Toolbar.MenuItem>
        <Toolbar.MenuDivider />
        <Toolbar.MenuItem>Release date</Toolbar.MenuItem>
        <Toolbar.MenuDivider />
        <Toolbar.MenuItem>Date added</Toolbar.MenuItem>
      </Toolbar.Menu>

      <Toolbar.Menu icon={<FolderExe variant="32x32_4" />} label="View">
        {views.map((option) => (
          <Toolbar.MenuItem key={option.value} checked={view === option.value} icon={option.icon} tabIndex={0}
            onClick={() => onViewChange(option.value)}
            onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onViewChange(option.value);
              }
            }}>
            {option.label}
          </Toolbar.MenuItem>
        ))}
        <Toolbar.MenuDivider />
        <Toolbar.MenuItem icon={<FolderFile variant="16x16_4" />}>
          Categories
        </Toolbar.MenuItem>
        <Toolbar.MenuDivider />
        <Toolbar.MenuItem icon={<Mailnews20 variant="16x16_4" />}>
          Mini pages
        </Toolbar.MenuItem>
      </Toolbar.Menu>
    </Toolbar>
  );
}

export default CollectionManagerToolbar;
