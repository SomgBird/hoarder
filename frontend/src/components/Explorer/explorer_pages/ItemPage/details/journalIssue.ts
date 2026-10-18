import type { JournalIssueDetailsRead } from "@types";
import type { Row } from "../rows";

export const journalIssueRows = (d: JournalIssueDetailsRead): Row[] => [
  { label: "Journal", value: d.journal?.name },
  { label: "Issue", value: d.issue },
  { label: "Pages", value: d.page_count },
];
