import { createContext, useContext } from "react";
import type { AppearanceSettings } from "@config/appearance";

interface AppearanceContextValue {
  settings: AppearanceSettings;
  updateSettings: (changes: Partial<AppearanceSettings>) => void;
}

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used within AppearanceProvider");
  return context;
}
