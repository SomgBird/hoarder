import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { AppearanceContext } from "./AppearanceContext";
import {
  applyAppearanceSettings,
  readAppearanceSettings,
  saveAppearanceSettings,
  type AppearanceSettings,
} from "@config/appearance";

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readAppearanceSettings);

  useLayoutEffect(() => applyAppearanceSettings(settings), [settings]);
  useEffect(() => saveAppearanceSettings(settings), [settings]);

  return (
    <AppearanceContext.Provider value={{
      settings,
      updateSettings: (changes: Partial<AppearanceSettings>) => setSettings((current) => ({ ...current, ...changes })),
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}
