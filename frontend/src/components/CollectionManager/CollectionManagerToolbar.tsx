import type { KeyboardEvent } from "react";
import { Toolbar } from "@components";
import type { ItemOrdering } from "@types";
import {
  Bookmark,
  Detlicon,
  Explorer101,
  Files,
  Folder,
  FolderExe,
  FolderFile,
  Mailnews20,
  Shdocvw272,
} from "@react95/icons";

export type CollectionItemViewMode = "table" | "list" | "icons" | "minipages";
export type CollectionViewMode = CollectionItemViewMode | "categories";

interface Props {
  view: CollectionViewMode;
  onViewChange: (view: CollectionViewMode) => void;
  ordering: ItemOrdering;
  onOrderingChange: (ordering: ItemOrdering) => void;
}

function CollectionManagerToolbar({ view, onViewChange, ordering, onOrderingChange }: Props) {
  const sortFields = [
    { value: "title", label: "Title" },
    { value: "release_date", label: "Release date" },
    { value: "date_added", label: "Date added" },
  ] as const;
  const sortDirections = [
    { value: "asc", label: "Ascending" },
    { value: "desc", label: "Descending" },
  ] as const;
  const activateOnKeyDown = (event: KeyboardEvent<HTMLLIElement>, activate: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
  const views = [
    { value: "table", label: "Table", icon: <Detlicon variant="16x16_4" /> },
    { value: "list", label: "List", icon: <FolderFile variant="16x16_4" /> },
    { value: "icons", label: "Icons", icon: <Shdocvw272 variant="16x16_4" /> },
    { value: "minipages", label: "Mini pages", icon: <Mailnews20 variant="16x16_4" /> },
  ] as const;

  return (
    <Toolbar>
      <Toolbar.Button icon={<Explorer101 variant="32x32_4" />} label="Search" />
      <Toolbar.Button icon={<Bookmark variant="32x32_4" />} label="Filter" />

      <Toolbar.Menu icon={<Files variant="32x32_4" />} label="Order">
        {sortFields.map((option) => (
          <Toolbar.MenuItem key={option.value} checked={ordering.sortBy === option.value} tabIndex={0}
            onClick={() => onOrderingChange({ ...ordering, sortBy: option.value })}
            onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => activateOnKeyDown(event,
              () => onOrderingChange({ ...ordering, sortBy: option.value }))}>
            {option.label}
          </Toolbar.MenuItem>
        ))}
        <Toolbar.MenuDivider />
        {sortDirections.map((option) => (
          <Toolbar.MenuItem key={option.value} checked={ordering.direction === option.value} tabIndex={0}
            onClick={() => onOrderingChange({ ...ordering, direction: option.value })}
            onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => activateOnKeyDown(event,
              () => onOrderingChange({ ...ordering, direction: option.value }))}>
            {option.label}
          </Toolbar.MenuItem>
        ))}
      </Toolbar.Menu>

      <Toolbar.Menu icon={<FolderExe variant="32x32_4" />} label="View">
        {views.map((option) => (
          <Toolbar.MenuItem key={option.value} checked={view === option.value} icon={option.icon} tabIndex={0}
            onClick={() => onViewChange(option.value)}
            onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => activateOnKeyDown(event, () => onViewChange(option.value))}>
            {option.label}
          </Toolbar.MenuItem>
        ))}
        <Toolbar.MenuDivider />
        <Toolbar.MenuItem checked={view === "categories"} icon={<Folder variant="16x16_4" />} tabIndex={0}
          onClick={() => onViewChange("categories")}
          onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => activateOnKeyDown(event, () => onViewChange("categories"))}>
          Categories
        </Toolbar.MenuItem>
      </Toolbar.Menu>
    </Toolbar>
  );
}

export default CollectionManagerToolbar;
