import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Fieldset, Frame, Tab, Tabs, TitleBar } from "@react95/core";
import { Settings as SettingsIcon } from "@react95/icons";
import { useAppearance } from "@components/AppearanceProvider";
import { HelpButton } from "@components/HelpButton/HelpButton";
import { ColorPicker } from "@components/ColorPicker/ColorPicker";
import { DEFAULT_APPEARANCE, themeOptions } from "@config/appearance";
import { AppearancePreview } from "./AppearancePreview";
import { BackgroundSettings } from "./BackgroundSettings";
import styles from "./Settings.module.css";

const TABS = ["Background", "Appearance"] as const;

export default function Settings() {
  const { settings, updateSettings } = useAppearance();
  const [draft, setDraft] = useState(settings);
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const [choosingColor, setChoosingColor] = useState(false);
  const [backgroundRevision, setBackgroundRevision] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const navigate = useNavigate();
  const changed = draft.theme !== settings.theme || draft.backgroundColor !== settings.backgroundColor
    || draft.wallpaper !== settings.wallpaper || draft.wallpaperMode !== settings.wallpaperMode;
  const close = () => navigate("/");
  const apply = () => {
    const saved = updateSettings(draft);
    setSaveFailed(!saved);
    return saved;
  };

  const tabKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    const index = TABS.indexOf(activeTab as typeof TABS[number]);
    const next = event.key === "ArrowRight" ? (index + 1) % TABS.length
      : event.key === "ArrowLeft" ? (index + TABS.length - 1) % TABS.length
        : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : null;
    if (next === null && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const tab = next === null ? event.currentTarget
      : event.currentTarget.parentElement?.querySelectorAll<HTMLLIElement>('[role="tab"]')[next];
    tab?.click();
    tab?.focus();
  };

  return (
    <>
      <Frame className={styles.window} bgColor="$material" boxShadow="$out" padding="$3"
        aria-label="Display Properties" role="region" inert={choosingColor}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Escape" && !choosingColor) close();
        }}>
        <TitleBar icon={<SettingsIcon variant="16x16_4" />} title="Display Properties">
          <TitleBar.OptionsBox>
            <HelpButton topic="settings" />
            <TitleBar.Close type="button" aria-label="Close settings" onClick={close} />
          </TitleBar.OptionsBox>
        </TitleBar>
        <div className={styles.content}>
          <Tabs role="tablist" aria-label="Display settings" onChange={(title) => {
            if (typeof title === "string") setActiveTab(title);
          }}>
            {TABS.map((title) => <Tab key={title} title={title} role="tab" id={`settings-tab-${title}`}
              aria-selected={activeTab === title} aria-controls={`settings-panel-${title}`}
              tabIndex={activeTab === title ? 0 : -1} onKeyDown={tabKeyDown}>
              <div className={styles.panel} id={`settings-panel-${title}`} role="tabpanel" aria-labelledby={`settings-tab-${title}`}>
                <AppearancePreview settings={draft} showWindows={title === "Appearance"} />
                {title === "Background" ? <BackgroundSettings key={backgroundRevision} settings={draft}
                  onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
                  onChooseColor={() => setChoosingColor(true)} /> : <Fieldset legend="Color scheme">
                  <div className={styles.scheme}>
                    <label htmlFor="react95-theme">Scheme:</label>
                    <Dropdown id="react95-theme" aria-label="React95 theme" width="100%"
                      options={themeOptions.map(({ label }) => label)}
                      value={themeOptions.find(({ name }) => name === draft.theme)?.label}
                      onChange={(event) => {
                        const option = themeOptions.find(({ label }) => label === event.target.value);
                        if (option) setDraft((current) => ({ ...current, theme: option.name }));
                      }} />
                  </div>
                </Fieldset>}
              </div>
            </Tab>)}
          </Tabs>
          <div className={styles.resetRow}>
            <Button type="button" onClick={() => {
              setDraft({ ...DEFAULT_APPEARANCE });
              setBackgroundRevision((revision) => revision + 1);
            }}>Reset to default</Button>
            <span>Click Apply to save changes.</span>
          </div>
          {saveFailed && <p role="alert" className={styles.wallpaperError}>
            Changes are applied for this session, but could not be saved in this browser.
            Try a smaller wallpaper or free some browser storage, then click Apply again.
          </p>}
        </div>
        <div className={styles.actions}>
          <Button type="button" onClick={() => { if (apply()) close(); }}>OK</Button>
          <Button type="button" onClick={close}>Cancel</Button>
          <Button type="button" disabled={!changed && !saveFailed} onClick={apply}>Apply</Button>
        </div>
      </Frame>
      {choosingColor && <ColorPicker value={draft.backgroundColor}
        onSelect={(backgroundColor) => {
          setDraft((current) => ({ ...current, backgroundColor }));
          setChoosingColor(false);
        }} onDismiss={() => setChoosingColor(false)} />}
    </>
  );
}
