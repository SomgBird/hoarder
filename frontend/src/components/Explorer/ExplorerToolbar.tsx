// ExplorerToolbar/ExplorerToolbar.tsx
import { Icon } from "@components";
import { Toolbar } from "@components";

function ExplorerToolbar() {
  return (
    <Toolbar>
      <Toolbar.Button icon={<Icon name="back" />} />
      <Toolbar.Button icon={<Icon name="forward" />} />
      <Toolbar.Button icon={<Icon name="stop" />} />
      <Toolbar.Button icon={<Icon name="refresh" />} />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Icon name="search" />} />
      <Toolbar.Button icon={<Icon name="star" />} label="Favorites" />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Icon name="printer" />} />

      <Toolbar.Separator />

      <Toolbar.Button icon={<Icon name="question_mark" />} />
    </Toolbar>
  );
}

export default ExplorerToolbar;
