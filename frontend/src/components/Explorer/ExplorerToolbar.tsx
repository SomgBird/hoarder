// ExplorerToolbar/ExplorerToolbar.tsx
import { Icon } from "@components";
import { Toolbar } from "@components";
import {
  Progman44,
  Progman45,
  Shell32134,
  Shell3217,
  Winhlp324001,
  Wmsui323934,
} from "@react95/icons";

function ExplorerToolbar() {
  return (
    <Toolbar>
      <Toolbar.Button icon={<Progman44 variant="32x32_4" />} label="Back" />
      <Toolbar.Button icon={<Progman45 variant="32x32_4" />} />
      <Toolbar.Button icon={<Icon name="stop" />} />
      <Toolbar.Button icon={<Icon name="refresh_page" />} />
      <Toolbar.Button icon={<Icon name="home" />} />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Shell32134 variant="32x32_4" />} label="Search" />
      <Toolbar.Button
        icon={<Wmsui323934 variant="32x32_4" />}
        label="Favorites"
      />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Shell3217 variant="32x32_4" />} />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Winhlp324001 variant="32x32_4" />} label="Help" />
    </Toolbar>
  );
}

export default ExplorerToolbar;
