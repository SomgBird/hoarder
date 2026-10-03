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

function CollectionManagerToolbar() {
  return (
    <Toolbar>
      <Toolbar.Button icon={<Explorer101 variant="32x32_4" />} label="Search" />
      <Toolbar.Button icon={<Bookmark variant="32x32_4" />} label="Filter" />

      <Toolbar.Menu icon={<Files variant="32x32_4" />} label="Order">
        <Toolbar.MenuItem>Title</Toolbar.MenuItem>
        <Toolbar.MenuItem>Release date</Toolbar.MenuItem>
        <Toolbar.MenuItem>Date added</Toolbar.MenuItem>
      </Toolbar.Menu>

      <Toolbar.Menu icon={<FolderExe variant="32x32_4" />} label="View">
        <Toolbar.MenuItem icon={<Shdocvw272 variant="16x16_4" />}>
          Icons
        </Toolbar.MenuItem>
        <Toolbar.MenuItem icon={<Detlicon variant="16x16_4" />}>
          Table
        </Toolbar.MenuItem>
        <Toolbar.MenuItem icon={<FolderFile variant="16x16_4" />}>
          Categories
        </Toolbar.MenuItem>
        <Toolbar.MenuItem icon={<Mailnews20 variant="16x16_4" />}>
          Mini pages
        </Toolbar.MenuItem>
      </Toolbar.Menu>
    </Toolbar>
  );
}

export default CollectionManagerToolbar;
