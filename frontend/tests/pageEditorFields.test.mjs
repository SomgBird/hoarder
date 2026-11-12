import "./helpers/register-source-loader.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { existingItem } from "./fixtures/item.mjs";
const { itemToFormState, buildItemUpdate } = await import("../src/pages/PageEditor/PageEditorWorkspace/pageEditorFields.ts");

test("an existing item's editable data round trips without losing references or metadata", () => {
  const payload = JSON.parse(JSON.stringify(buildItemUpdate(itemToFormState(existingItem))));
  assert.deepEqual(payload, {
    release_date: "2001-02-03", is_owned: true, description: "Original description",
    format_id: 3, selected_language_code: "ru", genre_ids: [5], franchise_ids: [7], tags: ["One, two"],
    titles: [
      { title_text: "Original title", short_text: "Original", language_code: "en" },
      { title_text: "Другой заголовок", language_code: "ru" },
    ],
    languages: [{ language_code: "ru", ui: true, text: true, voice: false }],
    barcodes: [{ code: "123456", barcode_type_id: 10 }],
    author_credits: [{ author_id: 11, role_name: "Writer", involvement_date: "2000-01-01", comments: "Author notes" }],
    company_credits: [{ company_id: 13, role_name: "Publisher", comments: "Company notes" }],
    details: { type_name: "book", page_count: 320 },
  });
});

test("clearing fields sends explicit nulls and clearing collections sends empty arrays", () => {
  const form = itemToFormState(existingItem);
  form.item = { is_owned: false };
  form.details = {};
  for (const key of ["languages", "barcodes", "authorCredits", "companyCredits"]) form[key] = [];
  const payload = JSON.parse(JSON.stringify(buildItemUpdate(form)));
  for (const key of ["release_date", "description", "format_id", "selected_language_code"]) assert.equal(payload[key], null, key);
  for (const key of ["genre_ids", "franchise_ids", "tags", "languages", "barcodes", "author_credits", "company_credits"]) assert.deepEqual(payload[key], [], key);
  assert.deepEqual(payload.details, { type_name: "book", page_count: null });
  assert.equal("cover_image_path" in payload, false);
  assert.equal("icon_image_path" in payload, false);
  assert.equal("owned_copies" in payload, false);
});

test("all subtype values and nested references load into the form and can be cleared", () => {
  const cases = [
    ["book", { page_count: 320 }, { page_count: 320 }],
    ["game", { game_platform: { id: 2, name: "Console" } }, { game_platform_id: 2 }],
    ["film", { length: 90 }, { length: 90 }],
    ["board_game", {}, {}],
    ["journal_issue", { journal: { id: 3, name: "Journal" }, issue: "5", page_count: 80 }, { journal_id: 3, issue: "5", page_count: 80 }],
    ["figurine", { scale: { id: 4, scale: "1:12" } }, { scale_id: 4 }],
    ["miniature", { scale: { id: 4, scale: "1:12" }, height: 0, width: 2.5 }, { scale_id: 4, height: 0, width: 2.5 }],
    ["lego_set", { number_of_pieces: 1000 }, { number_of_pieces: 1000 }],
  ];
  for (const [type_name, details, expected] of cases) {
    const form = itemToFormState({ ...existingItem, item_type: { id: 1, name: type_name }, details: { type_name, ...details } });
    assert.deepEqual(buildItemUpdate(form).details, { type_name, ...expected });
    form.details = {};
    assert.deepEqual(buildItemUpdate(form).details, { type_name, ...Object.fromEntries(Object.keys(expected).map((key) => [key, null])) });
  }
});
