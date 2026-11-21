# Current plan and handoff

**Ready to start · Pre-alpha 0.5 · Owned copies**

Let a collector record two physical copies of one catalog item and distinguish them by condition and notes. Start with an existing game that has zero copies. The first useful increment is adding a copy from Explorer and seeing its grade and notes after a reload. Photos follow in 0.7.

Use the [0.5 feature checklist and release demo](ROADMAP.md#05-owned-copies) to track progress. Tick each verified feature there and record the test result, tested revision and next unchecked feature in the handoff below.

## Implementation starting points

1. Trace how [owned copies](backend/app/db/models/ownership.py) reach the [item view](frontend/src/components/Explorer/explorer_pages/ItemPage/ItemView.tsx). The [current schemas](backend/app/db/schemas/parts.py) expose read shapes. Condition grades are already seeded and available through the [reference router](backend/app/routers/reference.py).
2. Add copy writes against an existing item and exercise them through its Explorer page. Keep copy identity stable when editing. Reuse the existing grade choices, API error handling and confirmation dialog.
3. Apply the ownership rule to the [collection query and filters](backend/app/db/crud/reads.py) and the visible status. The item editor can keep its manual flag. Show why an item with recorded copies counts as owned. Exercise the old flag-only cases in [item API tests](backend/tests/test_items.py).
4. Run through the release demo. Exercise lost-response retries in the API tests and failed saves, cancellation and copy selection in the UI tests. Update the relevant Help topic and record the results below. [AGENTS.md](AGENTS.md) lists the commands and working directories.

## Decisions to carry forward

| Decision | Reason |
| --- | --- |
| Owner priority, 2026-11-21 · Build rich collections and custom pages first. Schedule marketplace tracking later. | The pre-alpha demo should let someone explore a collection they authored. |
| Proposed ownership rule · A recorded copy makes an item effectively owned. Without copies, use the existing flag. | A collector can catalog individual copies gradually. Older records keep their meaning, including an unset flag. |
| Proposed page scope · Start with an article that can link to an item. Reuse text, gallery and link blocks for custom pages. | The first saved article exercises authoring, persistence, navigation and editing before adding more page types. |

## Session handoff

| Field | Current checkpoint |
| --- | --- |
| Branch and baseline | `hoarder-pre-alpha-0.4`, application revision `28662cd`. |
| Completed | Reconciled the PDF and current code, expanded versions 0.1–0.10 into feature checklists, and linked this card to the 0.5 checklist. |
| Verified | At the baseline revision, all 45 backend tests and 108 frontend tests passed. The new copy editor and vertical-slice walkthrough are pending. |
| Open work | The backend reads copies and the item view displays them. Copy write operations and editing controls are still needed. |
| Next action | Start 0.5 by tracing one existing copy from the API response into Explorer, then implement and verify adding a copy from that item page. |

Open the working branch on either computer and use this prompt in a fresh implementation chat.

> Read AGENTS.md and PLAN.md. Continue the active task from the handoff and update the checks when you stop.
