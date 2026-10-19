import { Input, RadioButton } from "@react95/core";

type PageType = "item" | "franchise" | "article" | "custom";

/** Everything the "new page" wizard collects. */
export interface PageData {
  pageType: PageType;
  title: string;
}

export interface StepProps {
  data: PageData;
  update: (changes: Partial<PageData>) => void;
}

const PAGE_TYPES: { value: PageType; label: string }[] = [
  {
    value: "item",
    label:
      "Item page — a page about speciffic item stored in collection or tracked by Hoarder.",
  },
  {
    value: "franchise",
    label: "Franchise page — a dedicated page about certain franchise.",
  },
  {
    value: "article",
    label: "Article — an article page with arbitrary text and design.",
  },
  {
    value: "custom",
    label: "Custom page — a page with custom design and content.",
  },
];

export function TypeStep({ data, update }: StepProps) {
  return (
    <>
      {PAGE_TYPES.map((t) => (
        <div key={t.value}>
          <RadioButton
            name="type"
            checked={data.pageType === t.value}
            onChange={() => update({ pageType: t.value })}
          >
            {t.label}
          </RadioButton>
        </div>
      ))}
    </>
  );
}

export function DetailsStep({ data, update }: StepProps) {
  return (
    <>
      <div style={{ marginBottom: 4 }}>Title</div>
      <Input
        autoFocus
        style={{ width: "100%" }}
        value={data.title}
        onChange={(e) => update({ title: e.target.value })}
      />
    </>
  );
}

export function ReviewStep({ data }: StepProps) {
  return (
    <>
      <div>Type: {data.pageType}</div>
      <div>Title: {data.title}</div>
    </>
  );
}
