import type { ReactNode } from "react";
import type { HelpTopicId } from "@config/help";

export const helpArticles: Record<HelpTopicId, { introduction: string; content: ReactNode; related: HelpTopicId[] }> = {
  welcome: {
    introduction: "Hoarder keeps your collection and its item pages together in one place.",
    content: <>
      <h2>Getting started</h2>
      <ol>
        <li>Open <strong>Collection → Page Editor</strong> to create your first item.</li>
        <li>Choose an item type and title, then fill in its details and save.</li>
        <li>Open <strong>Collection → Collection Manager</strong> to browse your items.</li>
      </ol>
      <h2>Using Help</h2>
      <p>Select a folder in the tree on the left to see its topics, then open a topic from the list or the tree. Use the + and − controls to expand or collapse folders.</p>
      <p>Back and Forward revisit folders and topics. Up opens the containing folder. The address path also links to parent folders. Print prints the current page.</p>
      <p>The question mark in a window opens its relevant topic in a separate Help window. Your current work stays open.</p>
      <h2>Available features</h2>
      <p>You can manage item pages, browse uploaded images, and change the display colors. Tracker, Barcode Scanner, Shopping List, and the other page types are not available yet.</p>
    </>,
    related: ["new-item", "collection", "settings"],
  },
  collection: {
    introduction: "Collection Manager lists the items in your collection. Explorer displays the item page you open.",
    content: <>
      <h2>Opening an item</h2>
      <p>Click an item once to select it. Double-click it, or select it and press Enter, to open its page in Explorer.</p>
      <h2>Choosing a view</h2>
      <p>Use <strong>View</strong> to choose Table, List, Icons, or Mini pages. Mini pages include a cover icon and a short summary. Categories shows folders for the supported item types; double-click a folder or press Enter to open it.</p>
      <h2>Ordering and paging</h2>
      <p>Use <strong>Order</strong> to sort by title, release date, or date added, in ascending or descending order. Use Previous and Next to move through the results.</p>
      <p>Changing the selection does not change the page currently open in Explorer.</p>
    </>, related: ["filters", "explorer", "new-item"],
  },
  filters: {
    introduction: "Search and filters narrow the items shown in Collection Manager.",
    content: <>
      <h2>Searching</h2>
      <ol><li>Click <strong>Search</strong> in the Collection Manager toolbar.</li><li>Enter a title and submit the search.</li><li>Use Clear to remove the search text.</li></ol>
      <h2>Filtering</h2>
      <p>Click <strong>Filter</strong> to choose a category, ownership state, and release or added date ranges. Blank values leave that condition unrestricted. The end date must be on or after the start date.</p>
      <p>Apply updates the list. Cancel closes the dialog without changing the filters. Reset filters clears the filter conditions and category.</p>
      <p>Choose <strong>Owned</strong> to find items with a recorded copy or a checked Owned box. After you remove the last copy, the filter uses the item’s Owned box again. A clear or unset box then places it under <strong>Not owned</strong>.</p>
      <p>Search and filter conditions work together. If no items match, clear the search or loosen the filters.</p>
    </>, related: ["collection", "explorer"],
  },
  explorer: {
    introduction: "Explorer shows an item’s titles, description, images, credits, and type-specific details.",
    content: <>
      <h2>Navigating</h2>
      <p>Use Back and Forward to revisit pages opened in Explorer. Home returns to the collection welcome page. Refresh reloads the current page and collection list.</p>
      <p>The address bar accepts <code>collection://home</code> and addresses such as <code>collection://item/42</code>. Press Enter to open an address.</p>
      <h2>Working with a page</h2>
      <p>Use <strong>File → New page…</strong> to start a new item. When an item is open, <strong>Edit → Edit page…</strong> opens its editor and <strong>File → Delete item…</strong> asks for confirmation before deleting it.</p>
      <p>Explorer’s Help menu and toolbar open this topic. About Hoarder opens the application information page.</p>
      <h2>Owned copies</h2>
      <p>The item page shows the grade and notes for each recorded copy. To make changes, use <strong>Edit → Edit copies…</strong> or the <strong>Copies</strong> toolbar button. Both open Copy Editor for the item shown in Explorer.</p>
    </>, related: ["copies", "collection", "filters", "edit-item", "delete-item"],
  },
  copies: {
    introduction: "Use Copy Editor to record and maintain the individual copies of a catalog item.",
    content: <>
      <h2>Choose an item</h2>
      <p>Open <strong>Collection → Copy Editor</strong>. Collection Manager stays beside the editor while you work. Select a row and choose <strong>Open copies</strong>, double-click the row, or press Enter to open that item. From Explorer, the <strong>Copies</strong> toolbar button opens the same layout with the current item ready to edit.</p>
      <h2>Record a copy</h2>
      <p>Select <strong>Add copy</strong>. Choose a condition grade, describe wear in Condition notes, and use Copy notes for details such as who gave it to you. Select <strong>Save copy</strong>. Repeat for each physical copy.</p>
      <p>Use <strong>Edit copy</strong> beside the copy you want to change. Cancel discards your edits. If a save fails, your entries stay in the form so you can retry. <strong>Remove copy</strong> asks you to confirm the copy number and grade.</p>
      <p>If you open another item with unsaved changes, choose <strong>Keep editing</strong> to return to your draft or <strong>Discard changes</strong> to open the other item.</p>
      <p>Choose <strong>View in Explorer</strong> to read the saved item page. Find the item again in Collection Manager under <strong>Filter → Ownership → Owned</strong>.</p>
    </>, related: ["explorer", "filters"],
  },
  "new-item": {
    introduction: "The New page wizard starts an item page and then opens the full editor.",
    content: <>
      <h2>Creating a page</h2>
      <ol><li>Open <strong>Collection → Page Editor</strong> or choose <strong>File → New page…</strong> in Explorer.</li><li>Choose Item page. Other page types are not implemented yet.</li><li>Enter a title and select an item type. Both are required.</li><li>Review the details and click Finish.</li><li>Complete the editor and click Create to save the item.</li></ol>
      <p>Finish opens the editor; it does not save an item by itself. Back returns to an earlier wizard step. Cancel asks before discarding the wizard’s entered data.</p>
      <h2>Adding details</h2>
      <p>Fill in the information relevant to your item. Selection lists let you choose existing entries. Where creation is offered, you can add an entry by name. Languages use the predefined choices.</p>
    </>, related: ["edit-item", "images", "collection"],
  },
  "edit-item": {
    introduction: "Edit an existing item from its open page in Explorer.",
    content: <>
      <h2>Saving changes</h2>
      <ol><li>Open the item and choose <strong>Edit → Edit page…</strong> or click Edit in the toolbar.</li><li>Update its title, description, references, credits, languages, barcodes, or other details.</li><li>Click Save to update that item. Cancel returns without saving.</li></ol>
      <p>An existing item’s type cannot be changed. Checkboxes may retain an unknown value until you explicitly set them.</p>
      <h2>If saving fails</h2>
      <p>The editor keeps your entered values so you can correct an error and retry. If the item saved but an image failed, retrying continues the image save without creating another item or repeating the completed item update.</p>
    </>, related: ["images", "explorer"],
  },
  images: {
    introduction: "Covers illustrate an item page. Icons identify it in collection views.",
    content: <>
      <h2>Adding images</h2>
      <p>Use the Cover and Icon sections in the item editor to select image files. The editor reports unsupported or invalid files. Images are uploaded when the item is saved.</p>
      <h2>Generating an icon</h2>
      <p><strong>Generate icon from cover</strong> creates 16×16, 32×32, and 64×64 icon sizes from the cover. It replaces the existing icon when saving. A cover must be available.</p>
      <p>Generation is enabled by default for a new item when a cover is selected. When editing an existing item, enable it explicitly to replace the icon. Disable generation if you want to upload an icon yourself.</p>
      <p>If an upload or generation fails, keep the editor open and retry, or choose another image.</p>
    </>, related: ["new-item", "edit-item", "media"],
  },
  "delete-item": {
    introduction: "Deleting an item permanently removes it and its page from your collection.",
    content: <>
      <h2>Deleting a page</h2>
      <ol><li>Open the item in Explorer.</li><li>Choose <strong>File → Delete item…</strong>.</li><li>Check the item’s title in the confirmation dialog.</li><li>Click Delete item to confirm, or Cancel to keep it.</li></ol>
      <p>Deletion cannot be undone. Cancel is focused when the confirmation opens. Escape also cancels before deletion begins.</p>
      <p>While deletion is in progress, wait for it to finish. If the request fails, the dialog stays open so you can retry. After a successful deletion, the collection refreshes and Explorer returns home.</p>
    </>, related: ["explorer", "collection"],
  },
  media: {
    introduction: "Media Viewer displays the uploaded image files available to Hoarder.",
    content: <>
      <h2>Browsing images</h2>
      <p>Open <strong>Collection → Media Viewer</strong>. Each file appears with a thumbnail and its name. Click to select it, then double-click or press Enter to open the original image.</p>
      <p>Refresh reloads the file list. If loading fails, use Retry. An empty list means there are no media files to display.</p>
    </>, related: ["image-viewer", "images"],
  },
  "image-viewer": {
    introduction: "The image window displays an original image at its full size.",
    content: <>
      <p>Scroll inside the image viewport when the image is larger than the window. Close it with the titlebar’s × button or press Escape to return to Media Viewer.</p>
      <p>If an image cannot load, use Retry. Closing the window returns keyboard focus to the selected thumbnail.</p>
    </>, related: ["media", "images"],
  },
  settings: {
    introduction: "Display Properties changes the desktop wallpaper, background color, and React95 color scheme.",
    content: <>
      <h2>Changing the appearance</h2>
      <ol><li>Open Settings from the main menu.</li><li>On Background, click the color button to choose a desktop color.</li><li>On Appearance, select a built-in React95 scheme.</li><li>Check the monitor preview, then click Apply to save or OK to save and close.</li></ol>
      <p>Cancel and the titlebar’s × button discard changes made since the last Apply. The preview updates before the application’s colors change.</p>
      <h2>Choosing wallpaper</h2>
      <p>On Background, click Browse… and choose a PNG, JPEG, WebP, GIF, BMP, or AVIF image up to 2 MB. The monitor previews it before you apply it.</p>
      <p>Center places the image at its original size in the middle of the desktop. Tile repeats it across the desktop. Stretch resizes it to fill the screen. The desktop color shows wherever the image does not cover the screen, including transparent areas.</p>
      <p>Fit horizontally scales the image to the desktop width while keeping its proportions. It stays centered vertically; tall images may extend beyond the top and bottom of the screen.</p>
      <p>Select (None) to remove the wallpaper. Wallpapers are saved in this browser along with your other appearance preferences.</p>
      <h2>Restoring the defaults</h2>
      <p>Click Reset to default, then Apply or OK. The project defaults are the Brick scheme, the teal background <code>#008080</code>, and no wallpaper.</p>
      <p>Appearance preferences are saved in this browser. If browser storage is unavailable, changes work for the current session.</p>
    </>, related: ["color-picker"],
  },
  "color-picker": {
    introduction: "The Color dialog provides basic colors, custom colors, and precise color controls.",
    content: <>
      <h2>Choosing a color</h2>
      <p>Click a basic color or drag in the spectrum to set hue and saturation. The vertical slider changes luminance. The sample shows the resulting color.</p>
      <p>You can also enter Hue, Sat, Lum, Red, Green, Blue, or a six-digit hex color such as <code>#008080</code>. Hue ranges from 0 to 239, saturation and luminance from 0 to 240, and RGB channels from 0 to 255.</p>
      <h2>Custom colors</h2>
      <p>Click Add to Custom Colors to store the current color in one of the 16 slots. Further additions advance to the next slot. Select a slot before adding to replace that slot. Saved custom colors are available the next time you open this dialog in the same browser.</p>
      <h2>Keyboard controls</h2>
      <p>Use arrow keys to move between palette swatches. In the spectrum, Left and Right adjust hue, Up and Down adjust saturation, and Shift makes larger changes. Tab moves between controls; Escape cancels.</p>
      <p>OK accepts the color for the settings preview. Apply or OK in Display Properties saves it as the desktop background. Cancel closes the color dialog without accepting its edits.</p>
    </>, related: ["settings"],
  },
  confirmations: {
    introduction: "Confirmation dialogs let you review an action before it is performed.",
    content: <>
      <p>Read the message and choose the action button to proceed, or the cancel button to keep your current state. Escape dismisses a confirmation when the action has not begun.</p>
      <p>While an action is in progress, its controls may be unavailable until it finishes. Help opens separately and does not confirm or cancel the action.</p>
    </>, related: ["delete-item", "new-item"],
  },
  about: {
    introduction: "Hoarder is a personal catalog for games, books, journals, collectibles, and other items.",
    content: <>
      <p>The About page shows the application version, author, and links to the project’s source code. Open it from the main menu or Explorer’s Help menu.</p>
      <p>Use Collection Manager for your catalog, Page Editor to create or edit items, Media Viewer for uploaded images, and Settings for display preferences.</p>
    </>, related: ["welcome", "collection", "settings"],
  },
};
