import type { ReactNode } from "react";
import styles from "./ItemView.module.css";
import type {
  ItemRead,
  ItemDetailsRead,
  AuthorCreditRead,
  CompanyCreditRead,
} from "@types";
import { coverUrl } from "@services";

interface Props {
  item: ItemRead;
}

type Row = { label: string; value: ReactNode };

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

// Empty values (null, undefined, "", []) are not worth a row.
function isEmpty(value: ReactNode): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

// Group credits by role so we get "Author: A, B" / "Illustrator: C"
// instead of one flat "Authors" row.
function groupByRole<T extends AuthorCreditRead | CompanyCreditRead>(
  credits: T[],
  getName: (credit: T) => string,
): Row[] {
  const groups = new Map<string, string[]>();
  for (const credit of credits) {
    const names = groups.get(credit.role.name) ?? [];
    names.push(getName(credit));
    groups.set(credit.role.name, names);
  }
  return [...groups].map(([label, names]) => ({
    label,
    value: names.join(", "),
  }));
}

// Subtype-specific rows. The switch is exhaustive: adding a new subtype to
// ItemDetailsRead makes this fail to compile until it's handled here.
function detailRows(details: ItemDetailsRead | null): Row[] {
  if (!details) return [];

  switch (details.type_name) {
    case "book":
      return [{ label: "Pages", value: details.page_count }];

    case "game":
      return [{ label: "Platform", value: details.game_platform?.name }];

    case "film":
      return [
        {
          label: "Length",
          value: details.length != null ? `${details.length} min` : null,
        },
      ];

    case "board_game":
      return [];

    case "journal_issue":
      return [
        { label: "Journal", value: details.journal?.name },
        { label: "Issue", value: details.issue },
        { label: "Pages", value: details.page_count },
      ];

    case "figurine":
      return [{ label: "Scale", value: details.scale?.scale }];

    case "miniature":
      return [
        { label: "Height", value: details.height },
        { label: "Width", value: details.width },
        { label: "Scale", value: details.scale?.scale },
      ];

    case "lego_set":
      return [{ label: "Pieces", value: details.number_of_pieces }];
  }
}

// ------------------------------------------------------------
// component
// ------------------------------------------------------------

function ItemView({ item }: Props) {
  const cover = coverUrl(item.cover_image_path);
  const title = item.titles[0]?.title_text || "Untitled";

  // Languages with ui/text/voice flags are only meaningful for some items
  // (games mostly). If any flag is set, show a table; otherwise a plain row.
  const hasLanguageFlags = item.languages.some(
    (l) => l.ui != null || l.text != null || l.voice != null,
  );

  const infoRows: Row[] = [
    // common rows
    ...groupByRole(item.author_credits, (c) => c.author.name),
    ...groupByRole(item.company_credits, (c) => c.company.name),
    { label: "Release date", value: item.release_date },
    { label: "Format", value: item.format?.name },
    // subtype rows
    ...detailRows(item.details),
    // common rows that come after
    { label: "Language", value: item.selected_language?.name },
    { label: "Genres", value: item.genres.map((g) => g.name).join(", ") },
    {
      label: "Franchises",
      value: item.franchises.map((f) => f.name).join(", "),
    },
  ].filter((row) => !isEmpty(row.value));

  return (
    <div className={styles.view}>
      <h1>{title}</h1>
      {item.tags.length > 0 && (
        <ul className={styles.tags}>
          {item.tags.map((tag) => (
            <li
              key={tag.id}
              className={styles.tag}
              title={tag.description ?? undefined}
            >
              {tag.name}
            </li>
          ))}
        </ul>
      )}
      <hr />
      <div className={styles.container}>
        <div className={styles.left_column}>
          {infoRows.length > 0 && (
            <div className={styles.section}>
              <h2>Info</h2>
              <table>
                <tbody>
                  {infoRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}:</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {item.description && (
            <div className={styles.section}>
              <h2>Description</h2>
              {item.description}
            </div>
          )}

          {item.owned_copies.length > 0 && (
            <div className={styles.section}>
              <h2>Owned copies</h2>
              {item.owned_copies.map((copy) => (
                <div key={copy.id}>
                  <strong>
                    {copy.condition?.condition_type?.name ?? "Copy"}
                  </strong>
                  {copy.condition?.notes && <> — {copy.condition.notes}</>}
                  {copy.notes && <p>{copy.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.right_column}>
          <div className={styles.section}>
            <h2>Cover</h2>
            {cover ? (
              <img
                src={cover}
                alt={title}
                width="100%"
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  background: "#eee",
                  borderRadius: 4,
                }}
              />
            )}
          </div>

          {item.languages.length > 0 && (
            <div className={styles.section}>
              <h2>Languages</h2>
              {hasLanguageFlags ? (
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>UI</th>
                      <th>Text</th>
                      <th>Voice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.languages.map(({ language, ui, text, voice }) => (
                      <tr key={language.id}>
                        <td>{language.name}</td>
                        <td>{ui ? "✓" : ""}</td>
                        <td>{text ? "✓" : ""}</td>
                        <td>{voice ? "✓" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <ul>
                  {item.languages.map(({ language }) => (
                    <li key={language.id}>{language.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {item.barcodes.length > 0 && (
            <div className={styles.section}>
              <h2>Barcodes</h2>
              <ul>
                {item.barcodes.map((b) => (
                  <li key={b.id}>
                    {b.code}
                    {b.barcode_type && ` (${b.barcode_type.name})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemView;
