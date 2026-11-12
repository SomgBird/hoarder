export const existingItem = {
  id: 42, display_title: "Original title", item_type: { id: 1, name: "book" },
  release_date: "2001-02-03", is_owned: true, description: "Original description",
  cover_image_path: "/media/covers/cover.png", icon_image_path: "/media/covers/icon.png",
  format: { id: 3, name: "Hardcover" }, selected_language: { id: 2, code: "ru", name: "Russian" },
  titles: [
    { id: 1, title_text: "Original title", short_text: "Original", language: { id: 1, code: "en", name: "English" } },
    { id: 2, title_text: "Другой заголовок", short_text: null, language: { id: 2, code: "ru", name: "Russian" } },
  ],
  languages: [{ language: { id: 2, code: "ru", name: "Russian" }, ui: true, text: true, voice: false }],
  genres: [{ id: 5, name: "Fantasy" }], franchises: [{ id: 7, name: "Existing franchise" }],
  tags: [{ id: 8, name: "One, two" }],
  barcodes: [{ id: 9, code: "123456", barcode_type: { id: 10, name: "EAN" } }],
  author_credits: [{ author: { id: 11, name: "Existing author" }, role: { id: 12, name: "Writer" }, involvement_date: "2000-01-01", comments: "Author notes" }],
  company_credits: [{ company: { id: 13, name: "Existing company" }, role: { id: 14, name: "Publisher" }, involvement_date: null, comments: "Company notes" }],
  details: { type_name: "book", page_count: 320 }, owned_copies: [],
};
