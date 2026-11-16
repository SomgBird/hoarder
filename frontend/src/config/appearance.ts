import { contract, tokens } from "@react95/core";
import type { CSSProperties } from "react";

export type ThemeName = keyof typeof tokens;

export interface AppearanceSettings {
  theme: ThemeName;
  backgroundColor: string;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "brick",
  backgroundColor: "#008080",
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
    const { theme, backgroundColor } = saved as Partial<AppearanceSettings>;
    return {
      theme: isThemeName(theme) ? theme : DEFAULT_APPEARANCE.theme,
      backgroundColor: typeof backgroundColor === "string" && /^#[\da-f]{6}$/i.test(backgroundColor)
        ? backgroundColor : DEFAULT_APPEARANCE.backgroundColor,
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function saveAppearanceSettings(settings: AppearanceSettings) {
  try {
    if (settings.theme === DEFAULT_APPEARANCE.theme && settings.backgroundColor === DEFAULT_APPEARANCE.backgroundColor) {
      localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    } else {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // Appearance still works for this session if browser storage is unavailable.
  }
}

export function appearanceStyle(settings: AppearanceSettings): CSSProperties {
  const variables: Record<string, string> = { "--hoarder-background": settings.backgroundColor };
  for (const group of Object.keys(contract) as (keyof typeof contract)[]) {
    const values: Record<string, string> = tokens[settings.theme][group];
    for (const [name, variable] of Object.entries(contract[group])) {
      variables[variable.slice(4, -1)] = values[name];
    }
  }
  return variables;
}

export function applyAppearanceSettings(settings: AppearanceSettings) {
  // Set variables on the document so portals inherit the same theme.
  for (const [variable, value] of Object.entries(appearanceStyle(settings))) {
    document.documentElement.style.setProperty(variable, value);
  }
}
