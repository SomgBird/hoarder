// frontend/src/BookList.tsx
import { useEffect, useState } from "react";
import { api, coverUrl } from "../api.ts";
import type { Book } from "../types";

export function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  if (books.length === 0) return <p>No books yet.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {books.map((b) => (
        <li key={b.id} style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {coverUrl(b.cover_image_path) ? (
            <img
              src={coverUrl(b.cover_image_path)!}
              alt={b.title}
              width={80}
              style={{ objectFit: "cover", borderRadius: 4 }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 120,
                background: "#eee",
                borderRadius: 4,
              }}
            />
          )}
          <div>
            <h3 style={{ margin: 0 }}>{b.title}</h3>
            <p style={{ margin: "4px 0", color: "#666" }}>
              {b.authors.map((a) => a.name).join(", ")}
              {b.language && ` · ${b.language.name}`}
              {b.pages && ` · ${b.pages} pp.`}
            </p>
            {b.description && (
              <p style={{ margin: "4px 0", maxWidth: 500 }}>{b.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
