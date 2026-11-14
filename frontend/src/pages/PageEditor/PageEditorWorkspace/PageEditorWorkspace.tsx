import { Button, Frame, TitleBar } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";
import { ITEM_TYPE_LABELS, ITEM_TYPE_OPTIONS, type ItemRead, type ItemType } from "@types";
import { ApiError, type ValidationIssue } from "@services/client";
import ContentFrame from "@components/ContentFrame/ContentFrame";
import type { PageData } from "../pageTypes";
import { Box, FieldInput, InfoTable, RowsEditor } from "./FormControls";
import { CreditsEditor } from "./CreditsEditor";
import { saveExistingItem, saveNewItem } from "./saveNewItem";
import { ImageUpload } from "./ImageUpload";
import { ReferencePicker } from "./ReferencePicker";
import { ReferenceContext, useReferenceData } from "./referenceData";
import {
  BARCODE_FIELDS,
  DESCRIPTION_FIELD,
  DETAILS_FIELDS,
  INFO_FIELDS,
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

    let payload;
    let updatePayload;
    try {
      const form = {
        itemType, item, details, titles, languages, barcodes, authorCredits, companyCredits,
      };
      payload = buildItemCreate(form);
      if (existingItem) updatePayload = buildItemUpdate(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

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
      const saved = existingItem && updatePayload
        ? await saveExistingItem(existingItem.id, updatePayload, coverFile, savedItem, remember, uploading, iconFile, uploaded, generateIconFromCover)
        : await saveNewItem(payload, coverFile, savedItem, remember, uploading, iconFile, uploaded, generateIconFromCover);
      setSavedItem(saved);
      setStatus("saved");
      onSaved?.(saved);
    } catch (e) {
      setStatus("idle");
      const message = e instanceof Error ? e.message : "Failed to save item.";
      setError(itemSaved ? `Item ${existingItem ? "updated" : "created"}, but an image could not be saved. Choose another image or retry. ${message}` : message);
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

  return (
    <ReferenceContext.Provider value={references}>
    <Frame bgColor="$material" boxShadow="$out" className={styles.window}>
      <TitleBar icon={<Mshtml32541 variant="16x16_4" />} title={existingItem ? "Page editor - edit item" : "Page editor - new item"} />

      {/* Win95 chrome: toolbar */}
      <div className={styles.toolbar}>
        <Button onClick={save} disabled={locked || !!coverError || !!iconError || references.loading || !!references.error}>
          {saveLabel}
        </Button>
        <Button onClick={onClose} disabled={busy}>{savedItem ? "Close" : "Cancel"}</Button>
      </div>
      {references.loading && <p role="status" className={styles.reference_status}>Loading selection lists…</p>}
      {references.pending > 0 && <p role="status" className={styles.reference_status}>Adding entry…</p>}
      {references.error && <div role="alert" className={styles.reference_status}>
        Could not load selection lists. {references.error}{" "}
        <button type="button" onClick={references.retry}>Retry</button>
      </div>}

      {/* Sunken viewport; ContentFrame resets styles for the web 1.0 page inside */}
      <Frame bgColor="canvas" boxShadow="in" className={styles.viewport}>
        <ContentFrame>
          {/* fieldset[disabled] locks every native control while saving */}
          <fieldset disabled={locked} className={styles.page}>
            <header className={styles.header}>
              <fieldset disabled={savedItem !== null} className={styles.field_group}>
                <div className={styles.title_row}>
                  <input
                    className={styles.title_input}
                    aria-label="Title"
                    placeholder="Title"
                    value={str(mainTitle.title_text)}
                    onChange={(e) => setMainTitle("title_text", e.target.value)}
                  />
                  <div className={styles.title_language}>
                    <FieldInput spec={{ key: "language_code", label: "Title language", kind: "reference", reference: "languages", required: true }}
                      value={mainTitle.language_code} onChange={(value) => setMainTitle("language_code", String(value))} />
                  </div>
                </div>
                <label>
                  Short title
                  <FieldInput spec={TITLE_FIELDS[1]} value={mainTitle.short_text}
                    onChange={(value) => setMainTitle("short_text", String(value))} />
                </label>
                <div className={styles.tags_row}>
                  <span className={styles.tags_label}>Tags</span>
                  <ReferencePicker resource="tags" label="Tags" multiple
                    value={Array.isArray(item.tags) ? item.tags : []}
                    onChange={(value) => setItem({ ...item, tags: value })} />
                </div>
              </fieldset>
            </header>

            <div className={styles.columns}>
              <fieldset disabled={savedItem !== null} className={`${styles.main} ${styles.field_group}`}>
                <Box title="Info">
                  <InfoTable specs={INFO_FIELDS} values={item} onChange={setItem}>
                    <tr>
                      <th scope="row">Type:</th>
                      <td>
                        <select
                          className={styles.input}
                          aria-label="Item type"
                          disabled={!!existingItem}
                          value={itemType ?? ""}
                          onChange={(e) =>
                            changeItemType(
                              ITEM_TYPE_OPTIONS.find((o) => o.value === e.target.value)?.value ?? null,
                            )
                          }
                        >
                          {!itemType && <option value="">—</option>}
                          {ITEM_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </InfoTable>

                  {itemType && detailSpecs.length > 0 && (
                    <>
                      <h3 className={styles.details_title}>{ITEM_TYPE_LABELS[itemType]} details</h3>
                      <InfoTable specs={detailSpecs} values={details} onChange={setDetails} />
                    </>
                  )}
                </Box>

                <Box title="Description">
                  <FieldInput
                    spec={DESCRIPTION_FIELD}
                    value={item.description}
                    onChange={(v) => setItem({ ...item, description: v })}
                  />
                </Box>

                <Box title="Alternative titles">
                  <RowsEditor
                    specs={TITLE_FIELDS}
                    rows={otherTitles}
                    onChange={(rows) => setTitles([mainTitle, ...rows])}
                  />
                </Box>

                <Box title="Authors">
                  <CreditsEditor kind="author" rows={authorCredits} onChange={setAuthorCredits} />
                </Box>

                <Box title="Companies">
                  <CreditsEditor kind="company" rows={companyCredits} onChange={setCompanyCredits} />
                </Box>
              </fieldset>

              <aside className={styles.side}>
                <Box title="Cover">
                  <ImageUpload label="Cover" file={coverFile} savedPath={imageItem?.cover_image_path ?? null} error={coverError}
                    onSelect={(file, message) => { setCoverFile(file); setCoverError(message); }} />
                </Box>
                <Box title="Icon">
                  <label className={styles.generate_icon}>
                    <input type="checkbox" checked={generateIconFromCover} disabled={!hasCover}
                      onChange={(event) => {
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
                <fieldset disabled={savedItem !== null} className={styles.field_group}>
                  <Box title="Languages">
                    <RowsEditor specs={LANGUAGE_FIELDS} rows={languages} onChange={setLanguages} />
                  </Box>
                </fieldset>
                <fieldset disabled={savedItem !== null} className={styles.field_group}>
                  <Box title="Barcodes">
                    <RowsEditor specs={BARCODE_FIELDS} rows={barcodes} onChange={setBarcodes} />
                  </Box>
                </fieldset>
              </aside>
            </div>
          </fieldset>
        </ContentFrame>
      </Frame>

      {/* Win95 chrome: status bar */}
      <Frame bgColor="$material" boxShadow="in" className={styles.statusbar}>
        {error && <div role="alert" className={styles.error}>
          {error}
          {validationErrors.length > 0 && <ul>{validationErrors.map((issue, index) => (
            <li key={index}>{issue.loc.filter((part) => part !== "body").map((part) => typeof part === "number" ? `#${part + 1}` : part.replaceAll("_", " ")).join(" / ")}: {issue.msg}</li>
          ))}</ul>}
        </div>}
        {status === "saved" && <span className={styles.success}>{savedItem?.cover_image_path || savedItem?.icon_image_path ? "Item and images saved." : existingItem ? "Item updated." : "Item created."}</span>}
      </Frame>
    </Frame>
    </ReferenceContext.Provider>
  );
}
