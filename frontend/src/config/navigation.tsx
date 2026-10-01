// src/config/navigation.tsx
import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import { Inetcpl1319, Winhlp324000 } from "@react95/icons";

export interface NavEntry {
  path?: string; // omit for folder-only parents
  label: string;
  icon?: ReactNode;
  Component?: ComponentType | LazyExoticComponent<ComponentType>;
  children?: readonly NavEntry[];
}

export const navigation: readonly NavEntry[] = [
  {
    path: "/",
    label: "Home",
    icon: <Inetcpl1319 variant="32x32_4" />,
    Component: lazy(() => import("../pages/Home/Home")),
  },
  {
    path: "/about",
    label: "About",
    icon: <Winhlp324000 variant="32x32_4" />,
    Component: lazy(() => import("../pages/About/About")),
  },
  {
    label: "Projects",
    icon: <Winhlp324000 variant="32x32_4" />,
    children: [
      {
        //path: "/projects/games",
        label: "Games",
        //Component: lazy(() => import("../pages/Games/Games")),
      },
      {
        //path: "/projects/books",
        label: "Books",
        //Component: lazy(() => import("../pages/Books/Books")),
      },
    ],
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
