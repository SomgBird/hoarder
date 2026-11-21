// src/config/navigation.tsx
import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import {
  ComputerFind,
  Defrag9,
  Files,
  HelpBook,
  Inetcpl1319,
  MicrosoftExchange,
  Notepad2,
  Progman17,
  Settings,
  Wangimg128,
  Winhlp324000,
} from "@react95/icons";

export interface NavEntry {
  path?: string; // omit for folder-only parents
  label: string;
  icon?: ReactNode;
  Component?: ComponentType | LazyExoticComponent<ComponentType>;
  children?: readonly NavEntry[];
}

export const navigation: readonly NavEntry[] = [
  {
    label: "Collection",
    icon: <Defrag9 variant="32x32_4" />,
    children: [
      {
        path: "/collection-view",
        label: "Collection Manager",
        icon: <Inetcpl1319 variant="32x32_4" />,
        Component: lazy(() =>
          import("@pages").then(({ CollectionView }) => ({
            default: CollectionView,
          })),
        ),
      },
      {
        path: "/page-editor",
        label: "Page Editor",
        icon: <Progman17 variant="32x32_4" />,
        Component: lazy(() =>
          import("@pages").then(({ PageEditor }) => ({
            default: PageEditor,
          })),
        ),
      },
      {
        path: "/copy-editor",
        label: "Copy Editor",
        icon: <Files variant="32x32_4" />,
        Component: lazy(() =>
          import("@pages").then(({ CopyEditor }) => ({ default: CopyEditor })),
        ),
      },
      {
        path: "/media-viewer",
        label: "Media Viewer",
        icon: <Wangimg128 variant="32x32_4" />,
        Component: lazy(() =>
          import("@pages").then(({ MediaViewer }) => ({ default: MediaViewer })),
        ),
      },
    ],
  },
  {
    label: "Tracker",
    icon: <ComputerFind variant="32x32_4" />,
  },
  {
    label: "Barcode Scanner",
    icon: <MicrosoftExchange variant="32x32_4" />,
  },
  {
    label: "Shopping List",
    icon: <Notepad2 variant="32x32_4" />,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: <Settings variant="32x32_4" />,
    Component: lazy(() =>
      import("@pages").then(({ Settings }) => ({ default: Settings })),
    ),
  },
  {
    path: "/help",
    label: "Help",
    icon: <HelpBook variant="32x32_4" />,
    Component: lazy(() =>
      import("@pages").then(({ Help }) => ({ default: Help })),
    ),
  },
  {
    path: "/",
    label: "About",
    icon: <Winhlp324000 variant="32x32_4" />,
    Component: lazy(() =>
      import("@pages").then(({ About }) => ({ default: About })),
    ),
  },
];

// Routable entries only (have both path and component), at any depth
export interface RouteEntry {
  path: string;
  Component: NonNullable<NavEntry["Component"]>;
}

export const flattenRoutes = (entries: readonly NavEntry[]): RouteEntry[] =>
  entries.flatMap(({ path, Component, children }) => [
    ...(path && Component ? [{ path, Component }] : []),
    ...(children ? flattenRoutes(children) : []),
  ]);

export const routes = flattenRoutes(navigation);
