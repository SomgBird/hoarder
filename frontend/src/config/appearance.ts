import { contract, tokens } from "@react95/core";
import type { CSSProperties } from "react";
import { isWallpaper, isWallpaperMode, type Wallpaper, type WallpaperMode } from "./wallpaper";

export type ThemeName = keyof typeof tokens;

export interface AppearanceSettings {
  theme: ThemeName;
  backgroundColor: string;
  wallpaper: Wallpaper | null;
  wallpaperMode: WallpaperMode;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "brick",
  backgroundColor: "#008080",
  wallpaper: null,
  wallpaperMode: "center",
};

export const APPEARANCE_STORAGE_KEY = "hoarder.appearance";

export const themeOptions = (Object.keys(tokens) as ThemeName[]).map((name) => ({
  name,
  label: name === "win95" ? "Windows 95" : name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase()),
}));

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && Object.hasOwn(tokens, value);
}

export function readAppearanceSettings(): AppearanceSettings {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return { ...DEFAULT_APPEARANCE };
    const { theme, backgroundColor, wallpaper, wallpaperMode } = saved as Partial<AppearanceSettings>;
    return {
      theme: isThemeName(theme) ? theme : DEFAULT_APPEARANCE.theme,
      backgroundColor: typeof backgroundColor === "string" && /^#[\da-f]{6}$/i.test(backgroundColor)
        ? backgroundColor : DEFAULT_APPEARANCE.backgroundColor,
      wallpaper: isWallpaper(wallpaper) ? wallpaper : null,
      wallpaperMode: isWallpaperMode(wallpaperMode) ? wallpaperMode : DEFAULT_APPEARANCE.wallpaperMode,
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function saveAppearanceSettings(settings: AppearanceSettings) {
  try {
    if (settings.theme === DEFAULT_APPEARANCE.theme && settings.backgroundColor === DEFAULT_APPEARANCE.backgroundColor
      && !settings.wallpaper && settings.wallpaperMode === DEFAULT_APPEARANCE.wallpaperMode) {
      localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    } else {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
    }
    return true;
  } catch {
    // Appearance still works for this session if browser storage is unavailable.
    return false;
  }
}

export function appearanceStyle(settings: AppearanceSettings, desktopSize?: { width: number; height: number }): CSSProperties {
  const { wallpaper, wallpaperMode } = settings;
  const imageSize = wallpaper && desktopSize
    ? `${wallpaper.width / desktopSize.width * 100}% ${wallpaper.height / desktopSize.height * 100}%`
    : wallpaper ? `${wallpaper.width}px ${wallpaper.height}px` : "auto";
  const variables: Record<string, string> = {
    "--hoarder-background": settings.backgroundColor,
    "--hoarder-wallpaper-size": wallpaperMode === "stretch" ? "100% 100%"
      : wallpaperMode === "fitWidth" ? "100% auto" : imageSize,
    "--hoarder-wallpaper-repeat": wallpaperMode === "tile" ? "repeat" : "no-repeat",
    "--hoarder-wallpaper-position": wallpaperMode === "tile" ? "left top" : "center center",
  };
  for (const group of Object.keys(contract) as (keyof typeof contract)[]) {
    const values: Record<string, string> = tokens[settings.theme][group];
    for (const [name, variable] of Object.entries(contract[group])) {
      variables[variable.slice(4, -1)] = values[name];
    }
  }
  return variables;
}

export function wallpaperImage(wallpaper: Wallpaper | null): string {
  return wallpaper ? `url(${JSON.stringify(wallpaper.dataUrl)})` : "none";
}

export function applyAppearanceSettings(settings: AppearanceSettings) {
  // Set variables on the document so portals inherit the same theme.
  for (const [variable, value] of Object.entries(appearanceStyle(settings))) {
    document.documentElement.style.setProperty(variable, value);
  }
  // Large data URLs exceed CSS custom-property limits; image properties accept them directly.
  document.body.style.backgroundImage = wallpaperImage(settings.wallpaper);
}
