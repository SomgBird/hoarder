import { Button, Dropdown, Frame, TitleBar } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";
import {
  ITEM_TYPE_LABELS,
  ITEM_TYPE_LABEL_LIST,
  itemTypeFromLabel,
  type ItemType,
} from "@types";
import { itemService } from "@services/itemService";
import type { PageData } from "../pageTypes";
import { FieldGroup, RowsEditor } from "./FormControls";
import {
  AUTHOR_CREDIT_FIELDS,
  BARCODE_FIELDS,
  COMPANY_CREDIT_FIELDS,
  DETAILS_FIELDS,
  ITEM_FIELDS,
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

  return (
    <Frame bgColor="$material" boxShadow="$out" className={styles.frame}>
      <TitleBar icon={<Mshtml32541 variant="16x16_4" />} title="Page editor - new item" />

      {/* fieldset[disabled] disables every native control inside it while saving */}
      <fieldset disabled={locked} className={styles.body}>
        <fieldset className={styles.section}>
          <legend>Item type</legend>
          <Dropdown
            options={ITEM_TYPE_LABEL_LIST}
            value={itemType ? ITEM_TYPE_LABELS[itemType] : ""}
            onChange={(e) => changeItemType(itemTypeFromLabel(e.currentTarget.value))}
          />
        </fieldset>

        <RowsEditor title="Titles" specs={TITLE_FIELDS} rows={titles} onChange={setTitles} />
        <FieldGroup title="Item" specs={ITEM_FIELDS} values={item} onChange={setItem} />
        {itemType && (
          <FieldGroup
            title={`${ITEM_TYPE_LABELS[itemType]} details`}
            specs={DETAILS_FIELDS[itemType]}
            values={details}
            onChange={setDetails}
          />
        )}
        <RowsEditor title="Languages" specs={LANGUAGE_FIELDS} rows={languages} onChange={setLanguages} />
        <RowsEditor title="Barcodes" specs={BARCODE_FIELDS} rows={barcodes} onChange={setBarcodes} />
        <RowsEditor title="Author credits" specs={AUTHOR_CREDIT_FIELDS} rows={authorCredits} onChange={setAuthorCredits} />
        <RowsEditor title="Company credits" specs={COMPANY_CREDIT_FIELDS} rows={companyCredits} onChange={setCompanyCredits} />
      </fieldset>

      <div className={styles.footer}>
        <div className={styles.status}>
          {error && <span className={styles.error}>{error}</span>}
          {status === "saved" && <span className={styles.success}>Item created.</span>}
        </div>
        <Button onClick={save} disabled={locked}>
          {status === "saving" ? "Saving..." : "Create"}
        </Button>
        <Button onClick={onClose}>{status === "saved" ? "Close" : "Cancel"}</Button>
      </div>
    </Frame>
  );
}