import { Button, Frame, TitleBar } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";
import { ITEM_TYPE_LABELS, ITEM_TYPE_OPTIONS, type ItemType } from "@types";
import { itemService } from "@services/itemService";
import ContentFrame from "@components/ContentFrame/ContentFrame";
import type { PageData } from "../pageTypes";
import { Box, FieldInput, InfoTable, RowsEditor } from "./FormControls";
import {
  AUTHOR_CREDIT_FIELDS,
  BARCODE_FIELDS,
  COMPANY_CREDIT_FIELDS,
  COVER_FIELDS,
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

const str = (v: string | boolean | undefined) => (typeof v === "string" ? v : "");

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

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  // The header edits the first title; "Alternative titles" edits the rest.
  const [mainTitle = {}, ...otherTitles] = titles;
  const setMainTitle = (key: string, v: string) =>
    setTitles([{ ...mainTitle, [key]: v }, ...otherTitles]);

  const tags = str(item.tags).split(",").map((t) => t.trim()).filter(Boolean);

  const changeItemType = (next: ItemType | null) => {
    if (!next || next === itemType) return;
    setItemType(next);
    setDetails({}); // subtype fields differ per type, so old values don't apply
  };

  const save = async () => {
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

    setStatus("saving");
    try {
      await itemService.create(payload);
      setStatus("saved");
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Failed to create item.");
    }
  };

  const locked = status !== "idle";
  const detailSpecs = itemType ? DETAILS_FIELDS[itemType] : [];

  return (
    <Frame bgColor="$material" boxShadow="$out" className={styles.window}>
      <TitleBar icon={<Mshtml32541 variant="16x16_4" />} title="Page editor - new item" />

      {/* Win95 chrome: toolbar */}
      <div className={styles.toolbar}>
        <Button onClick={save} disabled={locked}>
          {status === "saving" ? "Saving..." : "Create"}
        </Button>
        <Button onClick={onClose}>{status === "saved" ? "Close" : "Cancel"}</Button>
      </div>

      {/* Sunken viewport; ContentFrame resets styles for the web 1.0 page inside */}
      <Frame bgColor="canvas" boxShadow="in" className={styles.viewport}>
        <ContentFrame>
          {/* fieldset[disabled] locks every native control while saving */}
          <fieldset disabled={locked} className={styles.page}>
            <header className={styles.header}>
              <div className={styles.title_row}>
                <input
                  className={styles.title_input}
                  aria-label="Title"
                  placeholder="Title"
                  value={str(mainTitle.title_text)}
                  onChange={(e) => setMainTitle("title_text", e.target.value)}
                />
                <input
                  className={styles.lang_input}
                  aria-label="Title language code"
                  value={str(mainTitle.language_code)}
                  onChange={(e) => setMainTitle("language_code", e.target.value)}
                />
              </div>
              <div className={styles.tags_row}>
                {tags.map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
                <input
                  className={styles.tag_input}
                  aria-label="Tags"
                  placeholder="tags, comma separated"
                  value={str(item.tags)}
                  onChange={(e) => setItem({ ...item, tags: e.target.value })}
                />
              </div>
            </header>

            <div className={styles.columns}>
              <div className={styles.main}>
                <Box title="Info">
                  <InfoTable specs={INFO_FIELDS} values={item} onChange={setItem}>
                    <tr>
                      <th scope="row">Type:</th>
                      <td>
                        <select
                          className={styles.input}
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
                  <RowsEditor specs={AUTHOR_CREDIT_FIELDS} rows={authorCredits} onChange={setAuthorCredits} />
                </Box>

                <Box title="Companies">
                  <RowsEditor specs={COMPANY_CREDIT_FIELDS} rows={companyCredits} onChange={setCompanyCredits} />
                </Box>
              </div>

              <aside className={styles.side}>
                <Box title="Cover">
                  <InfoTable specs={COVER_FIELDS} values={item} onChange={setItem} />
                </Box>
                <Box title="Languages">
                  <RowsEditor specs={LANGUAGE_FIELDS} rows={languages} onChange={setLanguages} />
                </Box>
                <Box title="Barcodes">
                  <RowsEditor specs={BARCODE_FIELDS} rows={barcodes} onChange={setBarcodes} />
                </Box>
              </aside>
            </div>
          </fieldset>
        </ContentFrame>
      </Frame>

      {/* Win95 chrome: status bar */}
      <Frame bgColor="$material" boxShadow="in" className={styles.statusbar}>
        {error && <span className={styles.error}>{error}</span>}
        {status === "saved" && <span className={styles.success}>Item created.</span>}
      </Frame>
    </Frame>
  );
}