import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Compile the real form builder, resolving its one runtime alias without Vite.
const typesUrl = new URL("../src/types/itemTypes.ts", import.meta.url).href;
const source = readFileSync(new URL("../src/pages/PageEditor/PageEditorWorkspace/pageEditorFields.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText;
const { buildItemCreate } = await import(`data:text/javascript;base64,${Buffer.from(compiled.replace('"@types"', JSON.stringify(typesUrl))).toString("base64")}`);
const form = (changes = {}) => ({ itemType: "book", item: {}, details: {},
  titles: [{ title_text: "Example", language_code: "en" }], languages: [], barcodes: [],
  authorCredits: [], companyCredits: [], ...changes });

test("existing credits send IDs without names or UI metadata", () => {
  const payload = buildItemCreate(form({
    authorCredits: [{ row_key: "a", reference_mode: "existing", author_id: "7", selected_name: "Writer", role_name: "Writer" }],
    companyCredits: [{ row_key: "b", reference_mode: "existing", company_id: "9", selected_name: "Publisher", role_name: "Publisher" }],
  }));
  assert.deepEqual(payload.author_credits, [{ author_id: 7, role_name: "Writer", involvement_date: undefined, comments: undefined }]);
  assert.deepEqual(payload.company_credits, [{ company_id: 9, role_name: "Publisher", involvement_date: undefined, comments: undefined }]);
});

test("explicitly new credits send names, even when a stale ID is present", () => {
  const payload = buildItemCreate(form({
    authorCredits: [{ reference_mode: "new", author_name: " Пушкин ", author_id: "7", role_name: "Автор" }],
    companyCredits: [{ reference_mode: "new", company_name: " Мир ", company_id: "9", role_name: "Издатель" }],
  }));
  assert.equal(payload.author_credits[0].author_name, "Пушкин");
  assert.equal(payload.company_credits[0].company_name, "Мир");
  assert.equal("author_id" in payload.author_credits[0], false);
  assert.equal("company_id" in payload.company_credits[0], false);
});

test("existing mode requires a selected, positive integer ID", () => {
  for (const author_id of ["", "0", "-1", "1.5", "Infinity"]) {
    assert.throws(() => buildItemCreate(form({ authorCredits: [{ reference_mode: "existing", author_id, role_name: "Writer" }] })));
  }
});

test("new mode requires a nonblank name", () => {
  assert.throws(() => buildItemCreate(form({ companyCredits: [{ reference_mode: "new", company_name: "  ", role_name: "Publisher" }] })), /Company name is required/);
});

test("selected references use IDs internally and preserve tags containing commas", () => {
  const payload = buildItemCreate(form({
    itemType: "game", details: { game_platform_id: "8" },
    item: { format_id: "3", selected_language_code: "ru", genre_ids: ["1", "2"], franchise_ids: ["5"],
      tags: ["One, two", "Other"], cover_image_path: "/manual/path", icon_image_path: "/manual/icon" },
    languages: [{ language_code: "ru", text: true }],
    barcodes: [{ code: "123", barcode_type_id: "9" }],
  }));
  assert.equal(payload.format_id, 3);
  assert.deepEqual(payload.genre_ids, [1, 2]);
  assert.deepEqual(payload.franchise_ids, [5]);
  assert.deepEqual(payload.tags, ["One, two", "Other"]);
  assert.deepEqual(payload.details, { type_name: "game", game_platform_id: 8 });
  assert.equal(payload.selected_language_code, "ru");
  assert.equal(payload.languages[0].language_code, "ru");
  assert.equal(payload.barcodes[0].barcode_type_id, 9);
  assert.equal("cover_image_path" in payload, false);
  assert.equal("icon_image_path" in payload, false);
});
