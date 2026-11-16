import { useEffect, useRef, useState } from "react";
import { Button, Dropdown, Fieldset, Frame } from "@react95/core";
import type { AppearanceSettings } from "@config/appearance";
import { WALLPAPER_MODES, WALLPAPER_TYPES, isWallpaperMode } from "@config/wallpaper";
import { readWallpaper } from "./readWallpaper";
import styles from "./Settings.module.css";

interface Props {
  settings: AppearanceSettings;
  onChange: (changes: Partial<AppearanceSettings>) => void;
  onChooseColor: () => void;
}

export function BackgroundSettings({ settings, onChange, onChooseColor }: Props) {
  const [available, setAvailable] = useState(settings.wallpaper);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const wallpaper = settings.wallpaper ?? available;

  return <div className={styles.backgroundSettings}>
    <Fieldset legend="Wallpaper">
      <div className={styles.wallpaperChooser}>
        <div className={styles.wallpaperList}>
          <label htmlFor="desktop-wallpaper">Wallpaper:</label>
          <select id="desktop-wallpaper" size={3} value={settings.wallpaper ? "image" : "none"} disabled={loading}
            onChange={(event) => { setError(""); onChange({ wallpaper: event.target.value === "image" ? wallpaper : null }); }}>
            <option value="none">(None)</option>
            {wallpaper && <option value="image">{wallpaper.name}</option>}
          </select>
        </div>
        <div className={styles.wallpaperControls}>
          <Button type="button" onClick={() => input.current?.click()} disabled={loading}>Browse…</Button>
          <label htmlFor="wallpaper-display">Display:</label>
          <Dropdown id="wallpaper-display" className={styles.wallpaperDisplay}
            value={WALLPAPER_MODES[settings.wallpaperMode]} disabled={!settings.wallpaper}
            options={Object.values(WALLPAPER_MODES)} onChange={(event) => {
              const mode = Object.entries(WALLPAPER_MODES).find(([, label]) => label === event.target.value)?.[0];
              if (isWallpaperMode(mode)) onChange({ wallpaperMode: mode });
            }} />
        </div>
      </div>
      <input ref={input} type="file" hidden aria-label="Browse wallpaper" accept={WALLPAPER_TYPES.join(",")}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          request.current?.abort();
          const controller = new AbortController();
          request.current = controller;
          setError("");
          setLoading(true);
          try {
            const selected = await readWallpaper(file, controller.signal);
            if (controller.signal.aborted) return;
            setAvailable(selected);
            onChange({ wallpaper: selected });
          } catch (reason) {
            if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "This image could not be opened.");
          } finally {
            if (!controller.signal.aborted) setLoading(false);
          }
        }} />
      <p className={styles.wallpaperHint} role="status">{loading ? "Opening image…" : "Choose an image up to 2 MB. Select (None) to use only the desktop color."}</p>
      {error && <p className={styles.wallpaperError} role="alert">{error}</p>}
    </Fieldset>
    <Fieldset legend="Desktop color">
      <div className={styles.colorRow}>
        <span>Color:</span>
        <Button id="system-background" type="button" className={styles.colorButton}
          aria-label={`System background color: ${settings.backgroundColor.toUpperCase()}`}
          aria-haspopup="dialog" onClick={onChooseColor}>
          <Frame as="span" className={styles.colorSample} boxShadow="$in" style={{ backgroundColor: settings.backgroundColor }} />
          {settings.backgroundColor.toUpperCase()}<span className={styles.arrow} aria-hidden="true">▼</span>
        </Button>
      </div>
    </Fieldset>
  </div>;
}
