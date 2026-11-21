import {
  Bookmark, HelpBook, Icwdial101, Ie, Inetcpl1319, Mshtml32541, Mspaint,
  RecycleEmpty, Settings, Wangimg128, Winhlp324000,
} from "@react95/icons";
import type { HelpTopicId } from "@config/help";

const icons = {
  welcome: HelpBook, collection: Inetcpl1319, filters: Bookmark, explorer: Ie,
  "new-item": Mshtml32541, "edit-item": Mshtml32541, images: Wangimg128,
  "delete-item": RecycleEmpty, media: Wangimg128, "image-viewer": Wangimg128,
  settings: Settings, "color-picker": Mspaint, confirmations: Icwdial101, about: Winhlp324000,
};

export function HelpTopicIcon({ topic, size = 16 }: { topic: HelpTopicId; size?: 16 | 32 }) {
  const Icon = icons[topic];
  return <Icon variant="32x32_4" width={size} height={size} />;
}
