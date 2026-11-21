import { Button, Frame } from "@react95/core";
import { PageEditorWindow } from "../PageEditorWindow";
import { FilePen, Save } from "@react95/icons";
import { useState } from "react";
import { ITEM_TYPE_LABELS, ITEM_TYPE_OPTIONS, type ItemRead, type ItemType } from "@types";
import { ApiError, type ValidationIssue } from "@services/client";
import { EditorPanel, EditorTabs, type EditorSection } from "./EditorTabs";
import type { PageData } from "../pageTypes";
import { Box, FieldInput, InfoTable, RowsEditor } from "./FormControls";
import { CreditsEditor } from "./CreditsEditor";
import { saveExistingItem, saveNewItem } from "./saveNewItem";
import { ImageUpload } from "./ImageUpload";
import { ReferenceContext, useReferenceData } from "./referenceData";
import {
  BARCODE_FIELDS,
  DESCRIPTION_FIELD,
  DETAILS_FIELDS,
  GENERAL_FIELDS,
  CATALOG_FIELDS,
  DISPLAY_LANGUAGE_FIELD,
  LANGUAGE_FIELDS,
  TITLE_FIELDS,
  buildItemCreate,
  buildItemUpdate,
  itemToFormState,
  type Values,
} from "./pageEditorFields";
import styles from "./PageEditorWorkspace.module.css";

type PageEditorWorkspaceProps = ({ initialData: PageData; existingItem?: never } | { initialData?: never; existingItem: ItemRead }) & {
  onClose: () => void;
  onSaved?: (item: ItemRead) => void;
};

const str = (v: Values[string] | undefined) => (typeof v === "string" ? v : "");

export function PageEditorWorkspace({ initialData, existingItem, onClose, onSaved }: PageEditorWorkspaceProps) {
  const [active, setActive] = useState<EditorSection>("General");
  const [initialForm] = useState(() => existingItem ? itemToFormState(existingItem) : null);
  const [itemType, setItemType] = useState<ItemType | null>(initialForm?.itemType ?? initialData?.itemType ?? null);
  const [item, setItem] = useState<Values>(initialForm?.item ?? { is_owned: false });
  const [details, setDetails] = useState<Values>(initialForm?.details ?? {});
  const [titles, setTitles] = useState<Values[]>(initialForm?.titles ?? [
    { title_text: initialData?.title ?? "", short_text: "", language_code: "en" },
  ]);
  const [languages, setLanguages] = useState<Values[]>(initialForm?.languages ?? []);
  const [barcodes, setBarcodes] = useState<Values[]>(initialForm?.barcodes ?? []);
  const [authorCredits, setAuthorCredits] = useState<Values[]>(initialForm?.authorCredits ?? []);
  const [companyCredits, setCompanyCredits] = useState<Values[]>(initialForm?.companyCredits ?? []);

  const [status, setStatus] = useState<"idle" | "creating" | "updating" | "uploading" | "saved">("idle");
  // A successful write is a checkpoint if a later image upload needs a retry.
  const [savedItem, setSavedItem] = useState<ItemRead | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconError, setIconError] = useState("");
  const [autoGenerateIcon, setAutoGenerateIcon] = useState(!existingItem);
  const [uploadKind, setUploadKind] = useState<"cover" | "icon">("cover");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const references = useReferenceData(itemType);
  const imageItem = savedItem ?? existingItem;
  const hasCover = !!(coverFile || imageItem?.cover_image_path);
  const generateIconFromCover = autoGenerateIcon && hasCover;

  // The header edits the first title; "Alternative titles" edits the rest.
  const [mainTitle = {}, ...otherTitles] = titles;
  const setMainTitle = (key: string, v: string) =>
    setTitles([{ ...mainTitle, [key]: v }, ...otherTitles]);

  const changeItemType = (next: ItemType | null) => {
    if (!next || next === itemType) return;
    setItemType(next);
    setDetails({}); // subtype fields differ per type, so old values don't apply
    setItem((previous) => ({ ...previous, format_id: "", genre_ids: [] }));
  };

  const save = async () => {
    if (status !== "idle" || coverError || iconError || references.loading || references.error || references.pending) return;
    setValidationErrors([]);
    if (!itemType) {
      setError("Item type is required.");
      return;
    }
    setError("");

    const form = { itemType, item, details, titles, languages, barcodes, authorCredits, companyCredits };
    setStatus(savedItem ? "uploading" : existingItem ? "updating" : "creating");
    let itemSaved = savedItem !== null;
    try {
      const remember = (item: ItemRead) => {
        itemSaved = true;
        setSavedItem(item);
      };
      const uploading = (kind: "cover" | "icon") => { setUploadKind(kind); setStatus("uploading"); };
      const uploaded = (kind: "cover" | "icon") => {
        if (kind === "cover") setCoverFile(null);
        else { setIconFile(null); setAutoGenerateIcon(false); }
      };
      const saved = existingItem && initialForm
        ? await saveExistingItem(existingItem.id, buildItemUpdate(form, initialForm), coverFile, savedItem, remember, uploading, iconFile, uploaded, generateIconFromCover)
        : await saveNewItem(buildItemCreate(form), coverFile, savedItem, remember, uploading, iconFile, uploaded, generateIconFromCover);
      setSavedItem(saved);
      setStatus("saved");
      onSaved?.(saved);
    } catch (e) {
      setStatus("idle");
      const message = e instanceof Error ? e.message : "Failed to save item.";
      setError(itemSaved ? `Item ${existingItem ? "updated" : "created"}, but an image could not be saved. Choose another image or retry. ${message}` : message);
      if (itemSaved) setActive("Images");
      if (e instanceof ApiError) setValidationErrors(e.errors);
    }
  };

  const locked = status !== "idle" || references.pending > 0;
  const busy = status === "creating" || status === "updating" || status === "uploading" || references.pending > 0;
  const detailSpecs = itemType ? DETAILS_FIELDS[itemType] : [];
  const saveLabel = status === "creating" ? "Creating..."
    : status === "updating" ? "Saving..."
    : status === "uploading" ? (uploadKind === "icon" && generateIconFromCover ? "Generating icon..." : `Uploading ${uploadKind}...`)
    : savedItem && status !== "saved" ? (coverFile || iconFile || generateIconFromCover ? "Retry image save" : "Finish")
    : existingItem ? "Save" : "Create";

  const typeName = itemType ? ITEM_TYPE_LABELS[itemType] : "Item";
  const statusText = status === "saved"
    ? (savedItem?.cover_image_path || savedItem?.icon_image_path ? "Item and images saved." : existingItem ? "Item updated." : "Item created.")
    : references.loading ? "Loading selection lists…" : references.pending ? "Adding entry…"
    : busy ? saveLabel : coverError || iconError ? "Check the file selection on the Images tab." : "Ready";

  return <ReferenceContext.Provider value={references}>
    <PageEditorWindow className={styles.workspace} onClose={onClose} busy={busy} editing={!!existingItem}>
      <header className={styles.identity}>
        <FilePen variant="32x32_4" aria-hidden="true" />
        <div><h1>{str(mainTitle.title_text) || "Untitled item"}</h1>
          <span>{typeName} · {imageItem ? `Item #${imageItem.id}` : "New item"}</span></div>
      </header>

      <EditorTabs active={active} onSelect={setActive} />
      <Frame className={styles.sheet} bgColor="$material" boxShadow="$out">
        <fieldset disabled={locked || savedItem !== null} className={styles.field_group}>
          <EditorPanel title="General" active={active}>
            <div className={styles.columns}>
              <Box title="Page title">
                <label className={styles.field}>Title
                  <input className={styles.input} aria-label="Title" value={str(mainTitle.title_text)}
                    onChange={(e) => setMainTitle("title_text", e.target.value)} />
                </label>
                <label className={styles.field}>Short title
                  <FieldInput spec={TITLE_FIELDS[1]} value={mainTitle.short_text}
                    onChange={(value) => setMainTitle("short_text", String(value))} />
                </label>
                <div className={styles.field}>Title language
                  <FieldInput spec={{ ...TITLE_FIELDS[2], label: "Title language" }} value={mainTitle.language_code}
                    onChange={(value) => setMainTitle("language_code", String(value))} />
                </div>
              </Box>
              <Box title="Item details">
                <InfoTable specs={GENERAL_FIELDS}
                  values={item} onChange={setItem}>
                  <tr><th scope="row">Item type</th><td><span className={styles.selectControl}>
                    <select className={styles.input} aria-label="Item type" disabled={!!existingItem}
                      value={itemType ?? ""} onChange={(e) => changeItemType(ITEM_TYPE_OPTIONS.find((o) => o.value === e.target.value)?.value ?? null)}>
                      {!itemType && <option value="">—</option>}
                      {ITEM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </span></td></tr>
                </InfoTable>
                {detailSpecs.length > 0 && <InfoTable specs={detailSpecs} values={details} onChange={setDetails} />}
              </Box>
            </div>
            <Box title="Description">
              <FieldInput spec={DESCRIPTION_FIELD} value={item.description} onChange={(v) => setItem({ ...item, description: v })} />
            </Box>
          </EditorPanel>

          <EditorPanel title="Catalog" active={active}>
            <Box title="Classification">
              <InfoTable specs={CATALOG_FIELDS} values={item} onChange={setItem} />
            </Box>
            <Box title="Barcodes"><RowsEditor specs={BARCODE_FIELDS} rows={barcodes} onChange={setBarcodes} /></Box>
          </EditorPanel>

          <EditorPanel title="Languages" active={active}>
            <Box title="Display language">
              <FieldInput spec={DISPLAY_LANGUAGE_FIELD}
                value={item.selected_language_code} onChange={(value) => setItem({ ...item, selected_language_code: value })} />
            </Box>
            <div className={styles.columns}>
              <Box title="Alternative titles">
                <RowsEditor specs={TITLE_FIELDS} rows={otherTitles} onChange={(rows) => setTitles([mainTitle, ...rows])} />
              </Box>
              <Box title="Languages"><RowsEditor specs={LANGUAGE_FIELDS} rows={languages} onChange={setLanguages} /></Box>
            </div>
          </EditorPanel>

          <EditorPanel title="Credits" active={active}>
            <div className={styles.columns}>
              <Box title="Authors"><CreditsEditor kind="author" rows={authorCredits} onChange={setAuthorCredits} /></Box>
              <Box title="Companies"><CreditsEditor kind="company" rows={companyCredits} onChange={setCompanyCredits} /></Box>
            </div>
          </EditorPanel>
        </fieldset>
        <fieldset disabled={locked} className={styles.field_group}>
          <EditorPanel title="Images" active={active}>
            <div className={styles.columns}>
              <Box title="Cover">
                <ImageUpload label="Cover" file={coverFile} savedPath={imageItem?.cover_image_path ?? null} error={coverError}
                  onSelect={(file, message) => { setCoverFile(file); setCoverError(message); }} />
              </Box>
              <Box title="Icon">
                <label className={styles.generate_icon}>
                  <input type="checkbox" checked={generateIconFromCover} disabled={!hasCover} onChange={(event) => {
                    setAutoGenerateIcon(event.target.checked);
                    if (event.target.checked) { setIconFile(null); setIconError(""); }
                  }} />
                  Generate icon from cover
                </label>
                <p className={styles.icon_help}>{hasCover
                  ? "Creates 16×16, 32×32 and 64×64 sizes when saving. Replaces the current icon."
                  : "Upload a cover to generate an icon."}</p>
                <fieldset disabled={generateIconFromCover} className={styles.field_group}>
                  <ImageUpload label="Icon" file={iconFile} savedPath={imageItem?.icon_image_path ?? null} error={iconError}
                    onSelect={(file, message) => { setIconFile(file); setIconError(message); setAutoGenerateIcon(false); }} />
                </fieldset>
              </Box>
            </div>
          </EditorPanel>
        </fieldset>
      </Frame>

      {references.error && <div role="alert" className={styles.notice}>
        Could not load selection lists. {references.error} <Button onClick={references.retry}>Retry</Button>
      </div>}
      {error && <div role="alert" className={styles.notice}>
        {error}
        {validationErrors.length > 0 && <ul>{validationErrors.map((issue, index) => (
          <li key={index}>{issue.loc.filter((part) => part !== "body").map((part) => typeof part === "number" ? `#${part + 1}` : part.replaceAll("_", " ")).join(" / ")}: {issue.msg}</li>
        ))}</ul>}
      </div>}
      <div className={styles.actions}>
        <Button className={styles.save} onClick={save} disabled={locked || !!coverError || !!iconError || references.loading || !!references.error}>
          <Save variant="16x16_4" aria-hidden="true" />{saveLabel}
        </Button>
        <Button onClick={onClose} disabled={busy}>{savedItem ? "Close" : "Cancel"}</Button>
      </div>
      <div role="status" className={styles.statusbar}>{statusText}</div>
    </PageEditorWindow>
  </ReferenceContext.Provider>;
}
