# Hoarder pre-alpha roadmap

Pre-alpha ends when a collector can catalog a game and a book from the same franchise, document individual copies, and build an illustrated exhibit that connects their items and authored pages. The exhibit must still work after restarting Hoarder. The owner chose this collection and authoring workflow on 2026-11-21. Marketplace tracking comes later.

The next release is [0.6 Articles](#06-articles). [PLAN.md](PLAN.md) holds its active task and handoff. Checked boxes record implemented features. For new work, check a box when its described behavior works and record the verification in the handoff. Check off the release demo after completing it through the app.

| Baseline | Planned releases | Finish line |
| --- | --- | --- |
| [0.1 Book demo](#01-book-demo) · [0.2 Item catalog](#02-item-catalog) · [0.3 Collection browsing](#03-collection-browsing) · [0.4 Appearance and Help](#04-appearance-and-help) · [0.5 Owned copies](#05-owned-copies) | [0.6 Articles](#06-articles) · [0.7 Photos and galleries](#07-photos-and-galleries) · [0.8 Franchise pages](#08-franchise-pages) · [0.9 Custom pages and item layouts](#09-custom-pages-and-item-layouts) | [0.10 Vertical-slice demo](#010-vertical-slice-demo) · [Later backlog](#later-backlog) |

About reads the application version from [VERSION](VERSION). The [session handoff](PLAN.md#session-handoff) records the working branch and baseline. Versions 0.6–0.10 are proposed milestones. Revisit the schedule after the first article can be saved and reopened.

## 0.1 Book demo

The original demo established how a collector moves from a list to an item.

- [x] Serve a small book collection through the backend, including a list of books and individual records.
- [x] Create, update and delete a book through the demo API. Reject an ISBN already used by another book on creation.
- [x] Show the collection in a React95 Collection Manager. Display an empty state when there are no records.
- [x] Select a book and read it in the adjacent Explorer window.
- [x] Open About from the app and find the project description and source link.

## 0.2 Item catalog

This release replaced the book-only demo with editable records for a mixed collection.

- [x] Store and reopen books, video games, films, board games, journal issues, figurines, miniatures and LEGO sets in SQLite.
- [x] Start an item in Page Editor. Choose Item page, enter a title, choose its type and review the wizard choices before opening the editor.
- [x] Add translated titles and short titles, select the display language, and record supported interface, text and voice languages.
- [x] Set release date, ownership flag, format, genres, franchises, tags and description. Choose references by name and add new values where supported.
- [x] Enter people and company credits with roles, and record barcode values and their types.
- [x] Edit the fields specific to the chosen item type. Explorer renders those fields alongside the shared metadata.
- [x] Upload a cover or item icon and preview the selection in the editor. Retry a failed image save without creating a second item.
- [x] Reopen an item from Explorer in Page Editor, save changes to the same record, or cancel and return to its page.
- [x] Delete an item from Explorer after confirming its title. Canceling the confirmation keeps the record.

## 0.3 Collection browsing

This release made it possible to find a particular item as the catalog grew.

- [x] Switch between List for small icons and names, Icons for larger thumbnails, and Table for title, release date and date added.
- [x] Open Mini pages for a larger item icon, description, type, ownership and dates. The original PDF placed ownership in Table. The implemented views expose it here and in the ownership filter.
- [x] Browse category folders by item type. Single-click selects a result. Double-click or Enter opens it in Explorer.
- [x] Sort by title, release date or date added in either direction and page through the ordered results.
- [x] Search across titles and short titles. Combine the search with category, ownership and release-date or date-added ranges. Clear or reset the criteria to broaden the results.
- [x] Navigate Explorer with Back, Forward, Home and Refresh, and open an existing item by its `collection://item/<id>` address.
- [x] Open Media Viewer, browse uploaded files as thumbnails and open an original image by double-clicking or pressing Enter.
- [x] Generate 16, 32 and 64 pixel icons from an item's cover and display a fallback icon when an item icon cannot load.

## 0.4 Appearance and Help

Version 0.4 delivered the display controls and Help system. The remaining ideas from the original 0.4 list have entries in the [later backlog](#later-backlog).

- [x] Choose a React95 color scheme and preview it before applying it.
- [x] Set the desktop color with swatches or numeric color controls. Save custom swatches for reuse.
- [x] Browse for a wallpaper and preview Center, Tile, Stretch or Fit horizontally. Remove the wallpaper to show the desktop color.
- [x] Apply changes, discard an unapplied preview, or restore the default theme, teal background and empty wallpaper. Applied choices survive a browser reload.
- [x] Browse Help by topic, including Collection Manager, Explorer, creating and editing items, images and Settings. Use Back, Forward and Up within Help.
- [x] Open the relevant Help topic from a window's question-mark control while keeping the original window open.

## 0.5 Owned copies

**Outcome.** A collector with two copies of the same game can read their grades and notes in Explorer and edit either copy in Copy Editor. Collection Manager includes the item in the Owned filter while any copy remains.

**Record a copy**

- [x] Show the read-only **Owned copies** section even when an item has zero copies. Open **Copy Editor** from the Collection submenu with Collection Manager alongside it, or use Explorer’s **Edit → Edit copies…** or **Copies** toolbar button for the open item.
- [x] Choose an existing condition grade, enter condition notes such as “split case,” and enter separate copy notes such as “gift from Ana.”
- [x] Use **Add copy** in Copy Editor and show the saved copy immediately. Add a second copy with different details, reopen both after reload, and return to the item with **View in Explorer**.
- [x] Keep draft values after a failed save. If the first save succeeded but its response was lost, retrying that submission yields one copy.

**Edit, remove and filter**

- [x] Open one saved copy, change its grade or notes and save it. Preserve its identity, photo references and sibling copies.
- [x] Cancel an edit to leave the saved copy intact. Confirm a removal to delete only the selected copy.
- [x] Browse Collection Manager while a copy is being edited. Opening a different item with unsaved changes offers **Keep editing** and **Discard changes**.
- [x] Show an item as owned while it has recorded copies. Explain the displayed ownership when its manual Owned flag is clear.
- [x] Use the same ownership rule in Collection Manager results and filters. After the last copy is removed, use the stored flag again. Preserve the existing treatment of true, false and unset flags on older records.
- [x] Show each item’s recorded copy count in Table and Mini pages, with `-` for zero. Let collectors choose which Table columns to display and retain their choice when they reopen the app.
- [x] Add Help for recording copies and finding them through the ownership filter.
- [x] **Release demo.** Add a Good copy with a worn-box note and a Like New copy. Reopen, edit one and cancel a removal. Confirm removal of each in turn and verify the filter before and after the last removal. Cover the retry and flag-only cases in regression tests.

## 0.6 Articles

**Outcome.** A collector can write an article about a cataloged item, find it again in Explorer and follow its item link. The existing wizard offers Article but ends at “Not available.”

**Write and edit**

- [ ] Choose **Article** in the New page wizard, enter a title and open the article editor. Show a useful validation message for a blank title.
- [ ] Write a plain-text block, including paragraph breaks. Save it and read the same text on the article page.
- [ ] Add an item link by choosing an existing catalog item by title. Store its identity so renaming the item preserves the destination.
- [ ] Reopen the article in Page Editor, change its title, text or link target, and save to the same page. Canceling an edit restores the saved version.

**Find and follow**

- [ ] Add an authored-page list reachable from Explorer. Show article titles and a way to create the first page when the list is empty.
- [ ] Open a saved article from the list and by its own stable Explorer address. Keep existing item and home addresses working.
- [ ] Follow the article's item link and use Back to return. If a linked item has been deleted, identify the unavailable target and keep the article readable.
- [ ] **Release demo.** Create an article linking to a game, reload it from the page list, rename the game and follow the link. Edit the article and verify its original address still opens the revised text.

## 0.7 Photos and galleries

**Outcome.** A collector can photograph wear on a specific copy and reuse the picture in an article. This extends the copies from 0.5 and the article editor from 0.6.

**Photograph a copy**

- [x] In Copy Editor, choose one or more images for a new or saved copy, preview them and add an optional description to each.
- [x] Reopen the copy and see its captioned thumbnails. Open an original from the copy or find it by filename and copy number in Media Viewer.
- [x] Edit a caption or remove an attachment from the selected copy. Preserve the other copy's photos and the item's cover.
- [x] Explain an invalid file or failed upload and allow a retry without duplicating previously saved photos.

**Use collection images on a page**

- [ ] Add a gallery block to an article. Show existing collection images in the picker so a copy photo can be reused.
- [ ] Add multiple images and save their display order and captions. Reopen the article and display the gallery in that order.
- [ ] Remove one gallery entry while retaining the source copy's photo. If a copy attachment is removed first, preserve the file while a gallery still uses it.
- [ ] **Release demo.** Photograph a game's front and back, add both to an article and reload. Remove the front from the gallery and the back from the copy. Open each photo from its surviving location.

## 0.8 Franchise pages

**Outcome.** A game and a book assigned to one franchise lead to the same page. A collector writes the introduction once and the catalog supplies the member list.

- [ ] Choose **Franchise** in Page Editor and select an existing franchise by name. Reuse its catalog identity, including associations created before this release.
- [ ] Give the franchise a page with an editable introduction. Reopening the same franchise for authoring finds its existing page.
- [ ] Expose the franchise page in the authored-page list and make it reachable from the franchise name on a member item's Explorer page.
- [ ] Display each associated item's title and type. Open a member from the list and use Back to return to the franchise.
- [ ] Refresh membership when a collector adds or removes an item's franchise association. With no members, retain the introduction and show an empty list.
- [ ] **Release demo.** Open the same franchise from a game and a book, edit its introduction and reload. Remove the book's association. Confirm only the game remains on the franchise page and the book still opens in the catalog.

## 0.9 Custom pages and item layouts

**Outcome.** A collector can curate a standalone exhibit and annotate an ordinary catalog page using the same block editor.

**Build an exhibit**

- [ ] Choose **Custom page** in Page Editor, give it a title and save it as a standalone page discoverable from Explorer.
- [ ] Add and edit text and gallery blocks using the controls introduced for articles. Allow more than one block of the same kind.
- [ ] Add link blocks targeting a catalog item, an article or a franchise page. Show the target title and open the chosen record.
- [ ] Move blocks up and down, including by keyboard. Remove a block while preserving the linked record or source image.
- [ ] Save the block sequence and reopen it for editing. Cancel a pending reorder or removal to retain the saved layout.

**Annotate an item**

- [ ] From an existing item's editor, append a collector's note or a gallery to the standard item page.
- [ ] Edit or remove the added blocks independently of the item's title, cover, type-specific fields and owned copies.
- [ ] Open an older item with no added blocks and see its usual layout. Open an older article and see its existing text, gallery and links.
- [ ] **Release demo.** Build an exhibit linking an article and franchise. Move its gallery above the text, save and reopen it from Explorer. Annotate a book, then remove its annotation and verify that its original metadata and cover are intact.

## 0.10 Vertical-slice demo

**Outcome.** Someone can build and revisit a small illustrated collection using the released interface. Use a disposable collection for the main walkthrough and a separate disposable copy of an older collection for the upgrade check. Record the tested revision and results in [PLAN.md](PLAN.md).

**Build the collection**

- [ ] Catalog a game with a platform and a book with a page count. Give each a cover and assign both to the same franchise. Find the book by title and the game by category.
- [ ] Record two copies of the game. Give one a worn-box note and a photo. Edit the other copy's grade. Find the game using the Owned filter and identify both copies.
- [ ] Write an article with text, a captioned gallery and a link to the game. Open it from the page list and follow the link.
- [ ] Write the franchise introduction, follow its member link to the book and return with Back. Add a collector's note to the book.
- [ ] Build a custom exhibit linking the article and franchise. Move the gallery above the text and save.

**Reopen and verify**

- [ ] Restart the backend and reload the browser. Find the exhibit from Explorer. Follow both links and verify the block order, captions, covers, copy photo and book note.
- [ ] Use the keyboard to reach the page list, open a page, follow a link and return. Open contextual Help from the editing workflow and return to the work in progress.
- [ ] On the older collection, open a saved item address, compare its metadata, cover and original ownership flag, then link to that item from a new page. Reload and verify both records.
- [ ] Fix defects that prevent a step above from succeeding. Add Help at any step where the next action was unclear, then repeat the affected steps.
- [ ] **Pre-alpha exit.** Record the revision, results for both collections and verification evidence in the handoff. Close pre-alpha when the complete walkthrough passes.

## Later backlog

These proposals can be scheduled after the collection-and-pages demo. The PDF's original 0.5 Tracker moved here, its 0.6 owned-copy editor now starts in 0.5, and its 0.7 page ideas span 0.6–0.9.

**Marketplace tracking and shopping**

- [ ] Add an existing catalog item to a persistent wanted list and remove it when the search ends.
- [ ] Save multiple named marketplace search links per item, including Avito and eBay. Open one individually or open the item's full set in a separate window.
- [ ] Mark an item as checked and show the saved time in a Last checked column.
- [ ] Open a Shopping List of wanted items to consult while browsing or visiting a shop.

**Collection tools**

- [ ] **Referenced by.** On an item, list the articles and exhibits that link to it and open any of those pages.
- [ ] **Saved shelves.** Save a named combination of category, ownership and sort order. Reopen it against the current catalog.
- [ ] **Duplicate hint.** When an entered barcode matches an existing item, offer to open it and add a copy. Allow the collector to continue creating a distinct edition.
- [ ] **Barcode generation.** Render and print a barcode from a value already stored on an item.
- [ ] **Barcode Scanner.** Look up a scanned barcode value and open the matching catalog record.
- [ ] **Portable backup.** Export the catalog, authored pages and media together. Restore into an empty collection on another machine and open the original page links and photos.

**Remaining appearance and language ideas from 0.4**

- [ ] Add a persistent English/Russian language choice in Settings. Translate one complete cataloging flow, including validation messages and its Help topic.
- [ ] Expand About with a description of available features and where to start.
- [ ] Give the Explorer home and error pages distinct styling, with a clear route back to the collection.
- [ ] Prototype the original right-side banners in unused space and check that item content remains readable in narrow windows.
