import type { WizardStep } from "@components/Wizard/types";
import { Wizard } from "@components/Wizard/Wizard";
import { Button, Input, RadioButton } from "@react95/core";
import { Mshtml32541 } from "@react95/icons";
import { useState } from "react";

type PageType = "item" | "franchise" | "article" | "custom";

export function PageEditor() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState("");

  // The data lives here, in the code that uses the wizard
  const [pageType, setPageType] = useState<PageType>("item");
  const [title, setTitle] = useState("");

  // The steps are just a list: a title, some content, and an optional rule
  const steps: WizardStep[] = [
    {
      title: "Page type",
      content: (
        <>
          <div>
            <RadioButton
              name="type"
              checked={pageType === "item"}
              onChange={() => setPageType("item")}
            >
              Item page &mdash; a page about speciffic item stored in collection
              or tracked by Hoarder.
            </RadioButton>
          </div>
          <div>
            <RadioButton
              name="type"
              checked={pageType === "franchise"}
              onChange={() => setPageType("franchise")}
            >
              Franchise page &mdash; a dedicated page about certain franchise.
            </RadioButton>
          </div>
          <div>
            <RadioButton
              name="type"
              checked={pageType === "article"}
              onChange={() => setPageType("article")}
            >
              Article &mdash; an article page with arbitrary text and design.
            </RadioButton>
          </div>
          <div>
            <RadioButton
              name="type"
              checked={pageType === "custom"}
              onChange={() => setPageType("custom")}
            >
              Custom page &mdash; a page with custom design and content.
            </RadioButton>
          </div>
        </>
      ),
    },
    {
      title: "Details",
      validate: () => (title.trim() ? null : "Title is required."),
      content: (
        <>
          <div style={{ marginBottom: 4 }}>Title</div>
          <Input
            autoFocus
            style={{ width: "100%" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </>
      ),
    },
    {
      title: "Review",
      content: (
        <>
          <div>Type: {pageType}</div>
          <div>Title: {title}</div>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>New page...</Button>
      {result && <pre>{result}</pre>}
      {open && (
        <div style={{ marginTop: 16 }}>
          <Wizard
            title="New page"
            icon={<Mshtml32541 variant="16x16_4" />}
            steps={steps}
            onFinish={() => {
              setResult(JSON.stringify({ pageType, title }, null, 2));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            confirmCancel={false}
          />
        </div>
      )}
    </div>
  );
}
