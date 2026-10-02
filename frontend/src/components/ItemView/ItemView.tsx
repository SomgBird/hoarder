import styles from "./ItemView.module.css";
import { useEffect, useState } from "react";
import type { Item } from "@types";
import { itemService } from "../../services/itemService.ts";
import { coverUrl } from "../../services/utils.ts";

interface Props {
  id: number | null;
}

function ItemView({ id }: Props) {
  const [item, setItem] = useState<Item>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id !== null)
      itemService
        .get(id)
        .then(setItem)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [id]);

  if (!item) return <p>No book with id: {id}</p>;

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.view}>
      <h1>{item?.title}</h1>
      <hr />
      <div className={styles.container}>
        <div className={styles.left_column}>
          <div className={styles.section}>
            <h2>Info</h2>
            <table>
              <tbody>
                <tr>
                  <td>Authors:</td>
                  <td>{item.authors.map((a) => a.name).join(", ")}</td>
                </tr>
                <tr>
                  <td> Release date:</td>
                  <td>{item.release_date}</td>
                </tr>
                <tr>
                  <td>ISBN:</td>
                  <td>{item.isbn}</td>
                </tr>
                <tr>
                  <td>pages:</td>
                  <td>{item.pages}</td>
                </tr>
                <tr>
                  <td>Language:</td>
                  <td>{item.language?.name}</td>
                </tr>
                <tr>
                  <td>Publisher:</td>
                  <td>{item.publisher?.name}</td>
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
            {coverUrl(item.cover_image_path) ? (
              <img
                src={coverUrl(item.cover_image_path)!}
                alt={item.title}
                width={"100%"}
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
