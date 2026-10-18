import styles from "./ItemView.module.css";
import type { ItemRead } from "@types";
import { coverUrl } from "@services";
import { detailRows } from "./details";
import { groupByRole, isEmpty, type Row } from "./rows";

interface Props {
  item: ItemRead;
}

function ItemView({ item }: Props) {
  const cover = coverUrl(item.cover_image_path);
  const title = item.titles[0]?.title_text || "Untitled";

  // Languages with ui/text/voice flags are only meaningful for some items
  // (games mostly). If any flag is set, show a table; otherwise a plain list.
  const hasLanguageFlags = item.languages.some(
    (l) => l.ui != null || l.text != null || l.voice != null,
  );

  const infoRows: Row[] = [
    ...groupByRole(item.author_credits, (c) => c.author.name),
    ...groupByRole(item.company_credits, (c) => c.company.name),
    { label: "Release date", value: item.release_date },
    { label: "Format", value: item.format?.name },
    ...detailRows(item.details), // subtype-specific, see ./details
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
