# Current plan and handoff

**Ready to start · Pre-alpha 0.6 · Articles**

Let a collector write an article about a game, close the app, then reopen the article in Explorer and follow its link to the same game. The first increment is saving an article title and a paragraph and reopening both at a stable address. Track the remaining work in the [0.6 checklist and release demo](ROADMAP.md#06-articles).

## Implementation starting points

1. The [New page wizard](frontend/src/pages/PageEditor/PageEditorWizard/PageEditorWizard.tsx) already offers Article. The [page editor](frontend/src/pages/PageEditor/PageEditor.tsx) handles item records. The first missing piece is persisted article data. Add create and read operations for an article with a title and plain text. Exercise them against an empty database and one that already contains catalog items and copies.
2. Enable the wizard’s Article path, validate the title and open the article editor. Preserve paragraph breaks on save and reload. Reopen the same article for editing and verify that cancelling keeps its saved text.
3. Extend [Explorer locations](frontend/src/components/Explorer/locations.ts) with an article address and an authored-page list. Provide an entry point when the list is empty. Add an item picker using the [existing title search](frontend/src/services/itemService.ts). Keep the item identity in the saved link so a rename updates the displayed title and deletion leaves the article readable.
4. Run the roadmap demo with a disposable game. Reload the article from the list, rename the game, follow the link and use Back. Edit the article and reopen its original address. Run the API, frontend and contract checks in [AGENTS.md](AGENTS.md).

## Decisions to carry forward

| Decision | Reason |
| --- | --- |
| Owner priority, 2026-11-21 · Build rich collections and custom pages first. Schedule marketplace tracking later. | The pre-alpha demo should let someone explore a collection they authored. |
| Implemented in 0.5 · A recorded copy makes the item owned. Without copies, the collection uses the stored flag. | Older records keep their original flag, including an unset value. The Owned filter can find both manually marked items and individually recorded copies. |
| Implemented in 0.5 · Reserve each copy number for the lifetime of its item and reuse the submission ID when retrying a create. | A lost response can be retried, and delayed edits or removals cannot affect a replacement copy. |
| Proposed page scope · Start with an article that can link to an item. Reuse text, gallery and link blocks for custom pages. | The first saved article exercises authoring, persistence, navigation and editing before adding more page types. |

## Session handoff

| Field | Current checkpoint |
| --- | --- |
| Branch and tested revision | `hoarder-pre-alpha-0.5`, tested in the working tree based on `2313aa9`, with [VERSION](VERSION) set to `0.5.0-pre-alpha`. |
| Completed | All [0.5 owned-copy checks](ROADMAP.md#05-owned-copies), including Explorer controls, the ownership filter and Help. |
| Automated verification | 50 backend tests and 110 frontend tests passed. Coverage includes concurrent create retries, failed saves, cancelled edits and removals, legacy copies with photos, and true, false and unset manual flags. API type generation and the freshness check, frontend lint and the production build passed. |
| Release demo | In Chrome with a disposable SQLite game and a clear Owned flag, added a Good copy with a worn-box note and a separate gift note. Interrupted the successful response and retried. Added a Like New copy and reloaded both. Changed the first copy to Acceptable, cancelled removal of the second, then confirmed both removals in turn. The Owned filter retained the game until the final removal, when the game returned to Not owned. |
| Open work | 0.6 begins with article storage. Adding photos to individual copies is scheduled for 0.7. |
| Next action | Implement the article create and read path and verify that a title and multiline paragraph survive reopening the database. |

Open the working branch on either computer and use this prompt in a fresh implementation chat.

> Read AGENTS.md and PLAN.md. Continue the active task from the handoff and update the checks when you stop.
