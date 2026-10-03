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
  Inetcpl1319,
  MicrosoftExchange,
  Notepad2,
  Progman17,
  Settings,
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
        path: "/",
        label: "Collection Manager",
        icon: <Inetcpl1319 variant="32x32_4" />,
        Component: lazy(() =>
          import("@pages").then(({ Home }) => ({ default: Home })),
        ),
      },
      {
        label: "Page Editor",
        icon: <Progman17 variant="32x32_4" />,
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
    label: "Settings",
    icon: <Settings variant="32x32_4" />,
  },
  {
    path: "/about",
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
