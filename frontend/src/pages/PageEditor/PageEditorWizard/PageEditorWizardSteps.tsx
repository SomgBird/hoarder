import { Dropdown, Input, RadioButton } from "@react95/core";
import { FilePen, FileSettings, FileText, FolderFile } from "@react95/icons";
import { ITEM_TYPE_LABELS, ITEM_TYPE_LABEL_LIST, itemTypeFromLabel } from "@types";
import type { PageData } from "../pageTypes";
import styles from "./PageEditorWizard.module.css";

export interface StepProps {
  data: PageData;
  update: (changes: Partial<PageData>) => void;
}

const pageTypes = [
  { value: "item", label: "Item page", icon: FilePen },
  { value: "franchise", label: "Franchise page", icon: FolderFile },
  { value: "article", label: "Article", icon: FileText },
  { value: "custom", label: "Custom page", icon: FileSettings },
] as const;

export function TypeStep({ data, update }: StepProps) {
  return <>
    <p className={styles.prompt}>What kind of page do you want to create?</p>
    <div className={styles.choices} role="radiogroup" aria-label="Page type">
      {pageTypes.map(({ value, label, icon: Icon }) => (
        <RadioButton key={value} name="page-type" checked={data.pageType === value} onChange={() => update({ pageType: value })}>
          <span className={styles.choice}><Icon variant="16x16_4" aria-hidden="true" />{label}</span>
        </RadioButton>
      ))}
    </div>
  </>;
}

export function DetailsStep({ data, update }: StepProps) {
  return <div className={styles.fields}>
    <label htmlFor="new-page-title">Title</label>
    <Input id="new-page-title" autoFocus value={data.title} onChange={(e) => update({ title: e.target.value })} />
    {data.pageType === "item" && <>
      <label htmlFor="new-item-type">Item type</label>
      <Dropdown id="new-item-type" options={["", ...ITEM_TYPE_LABEL_LIST]}
        value={data.itemType ? ITEM_TYPE_LABELS[data.itemType] : ""}
        onChange={(e) => update({ itemType: itemTypeFromLabel(e.currentTarget.value) })} />
    </>}
  </div>;
}

export function ReviewStep({ data }: StepProps) {
  const label = pageTypes.find((type) => type.value === data.pageType)?.label;
  return <>
    <p className={styles.prompt}>Choose Finish to open the page in Page Editor.</p>
    <dl className={styles.review}>
      <dt>Page type</dt><dd>{label}</dd>
      {data.pageType === "franchise" ? <><dt>Franchise</dt><dd>{data.franchise?.name}</dd></>
        : <><dt>Title</dt><dd>{data.title.trim()}</dd></>}
      {data.pageType === "item" && <><dt>Item type</dt><dd>{data.itemType && ITEM_TYPE_LABELS[data.itemType]}</dd></>}
    </dl>
  </>;
}

export function NotImplementedStep({ data }: StepProps) {
  const label = pageTypes.find((type) => type.value === data.pageType)?.label;
  return <p>{label} is planned for a future release. Choose Back to select another page type.</p>;
}
