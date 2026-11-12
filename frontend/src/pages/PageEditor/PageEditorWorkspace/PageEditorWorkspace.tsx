import { Button, Frame, TitleBar } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";
import { ITEM_TYPE_LABELS, ITEM_TYPE_OPTIONS, type ItemRead, type ItemType } from "@types";
import { ApiError, type ValidationIssue } from "@services/client";
import ContentFrame from "@components/ContentFrame/ContentFrame";
import type { PageData } from "../pageTypes";
import { Box, FieldInput, InfoTable, RowsEditor } from "./FormControls";
import { CreditsEditor } from "./CreditsEditor";
import { saveNewItem } from "./saveNewItem";
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
  type Values,
} from "./pageEditorFields";
import styles from "./PageEditorWorkspace.module.css";

interface PageEditorWorkspaceProps {
  initialData: PageData;
  onClose: () => void;
}

const str = (v: Values[string] | undefined) => (typeof v === "string" ? v : "");

export function PageEditorWorkspace({ initialData, onClose }: PageEditorWorkspaceProps) {
  // Wizard data only seeds the form; from here on the editor owns its values.
  const [itemType, setItemType] = useState<ItemType | null>(initialData.itemType);
  const [item, setItem] = useState<Values>({ is_owned: false });
  const [details, setDetails] = useState<Values>({});
  const [titles, setTitles] = useState<Values[]>([
    { title_text: initialData.title, short_text: "", language_code: "en" },
  ]);
  const [languages, setLanguages] = useState<Values[]>([]);
  const [barcodes, setBarcodes] = useState<Values[]>([]);
  const [authorCredits, setAuthorCredits] = useState<Values[]>([]);
  const [companyCredits, setCompanyCredits] = useState<Values[]>([]);

  const [status, setStatus] = useState<"idle" | "creating" | "uploading" | "saved">("idle");
  const [createdItem, setCreatedItem] = useState<ItemRead | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconError, setIconError] = useState("");
  const [uploadKind, setUploadKind] = useState<"cover" | "icon">("cover");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const references = useReferenceData(itemType);

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
    try {
      payload = buildItemCreate({
        itemType, item, details, titles, languages, barcodes, authorCredits, companyCredits,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    setStatus(createdItem ? "uploading" : "creating");
    let itemCreated = createdItem !== null;
    try {
      const saved = await saveNewItem(payload, coverFile, createdItem, (item) => {
        itemCreated = true;
        setCreatedItem(item);
      }, (kind) => { setUploadKind(kind); setStatus("uploading"); }, iconFile,
      (kind) => { if (kind === "cover") setCoverFile(null); else setIconFile(null); });
      setCreatedItem(saved);
      setStatus("saved");
    } catch (e) {
      setStatus("idle");
      const message = e instanceof Error ? e.message : "Failed to save item.";
      setError(itemCreated ? `Item created, but an image could not be uploaded. Choose another image or retry. ${message}` : message);
      if (e instanceof ApiError) setValidationErrors(e.errors);
    }
  };

  const locked = status !== "idle" || references.pending > 0;
  const busy = status === "creating" || status === "uploading" || references.pending > 0;
  const detailSpecs = itemType ? DETAILS_FIELDS[itemType] : [];
  const saveLabel = status === "creating" ? "Creating..."
    : status === "uploading" ? `Uploading ${uploadKind}...`
    : createdItem && status !== "saved" ? (coverFile || iconFile ? "Retry image upload" : "Finish")
    : "Create";

  return (
    <ReferenceContext.Provider value={references}>
    <Frame bgColor="$material" boxShadow="$out" className={styles.window}>
      <TitleBar icon={<Mshtml32541 variant="16x16_4" />} title="Page editor - new item" />

      {/* Win95 chrome: toolbar */}
      <div className={styles.toolbar}>
        <Button onClick={save} disabled={locked || !!coverError || !!iconError || references.loading || !!references.error}>
          {saveLabel}
        </Button>
        <Button onClick={onClose} disabled={busy}>{createdItem ? "Close" : "Cancel"}</Button>
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
              <fieldset disabled={createdItem !== null} className={styles.field_group}>
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
                <div className={styles.tags_row}>
                  <span className={styles.tags_label}>Tags</span>
                  <ReferencePicker resource="tags" label="Tags" multiple
                    value={Array.isArray(item.tags) ? item.tags : []}
                    onChange={(value) => setItem({ ...item, tags: value })} />
                </div>
              </fieldset>
            </header>

            <div className={styles.columns}>
              <fieldset disabled={createdItem !== null} className={`${styles.main} ${styles.field_group}`}>
                <Box title="Info">
                  <InfoTable specs={INFO_FIELDS} values={item} onChange={setItem}>
                    <tr>
                      <th scope="row">Type:</th>
                      <td>
                        <select
                          className={styles.input}
                          aria-label="Item type"
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
                  <ImageUpload label="Cover" file={coverFile} savedPath={createdItem?.cover_image_path ?? null} error={coverError}
                    onSelect={(file, message) => { setCoverFile(file); setCoverError(message); }} />
                </Box>
                <Box title="Icon">
                  <ImageUpload label="Icon" file={iconFile} savedPath={createdItem?.icon_image_path ?? null} error={iconError}
                    onSelect={(file, message) => { setIconFile(file); setIconError(message); }} />
                </Box>
                <fieldset disabled={createdItem !== null} className={styles.field_group}>
                  <Box title="Languages">
                    <RowsEditor specs={LANGUAGE_FIELDS} rows={languages} onChange={setLanguages} />
                  </Box>
                </fieldset>
                <fieldset disabled={createdItem !== null} className={styles.field_group}>
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
        {status === "saved" && <span className={styles.success}>{createdItem?.cover_image_path || createdItem?.icon_image_path ? "Item and images saved." : "Item created."}</span>}
      </Frame>
    </Frame>
    </ReferenceContext.Provider>
  );
}
