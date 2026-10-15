import styles from "./ItemView.module.css";
import type { ItemRead } from "@types";
import { coverUrl } from "@services";

interface Props {
  item: ItemRead;
}

function ItemView({ item }: Props) {
  const cover = coverUrl(item.cover_image_path);
  const title = item.titles[0]?.title_text || "Untitled";

  return (
    <div className={styles.view}>
      <h1>{title}</h1>
      <hr />
      <div className={styles.container}>
        <div className={styles.left_column}>
          <div className={styles.section}>
            <h2>Info</h2>
            <table>
              <tbody>
                <tr>
                  <td>Authors:</td>
                  <td>{}</td>
                </tr>
                <tr>
                  <td>Release date:</td>
                  <td>{item.release_date}</td>
                </tr>
                <tr>
                  <td>ISBN:</td>
                  <td>{}</td>
                </tr>
                <tr>
                  <td>Pages:</td>
                  <td>{}</td>
                </tr>
                <tr>
                  <td>Language:</td>
                  <td>{}</td>
                </tr>
                <tr>
                  <td>Publisher:</td>
                  <td>{}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles.section}>
            <h2>Description</h2>
            {item.description}
          </div>
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
        </div>
      </div>
    </div>
  );
}

export default ItemView;