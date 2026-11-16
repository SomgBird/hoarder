import { useLayoutEffect, useState, type ReactNode } from "react";
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

  return (
    <AppearanceContext.Provider value={{
      settings,
      updateSettings: (next: AppearanceSettings) => {
        const saved = saveAppearanceSettings(next);
        setSettings(next);
        return saved;
      },
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}
