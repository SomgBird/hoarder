import { useState } from "react";

const CATEGORIES = ["game", "comic"];

const EMPTY = {
  title: "",
  category: "game",
  status: "owned",
  condition: "",
  cover_url: "",
  notes: "",
};

export default function AddItemForm({ onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [attributesText, setAttributesText] = useState("{}");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let attributes;
    try {
      attributes = attributesText.trim() ? JSON.parse(attributesText) : {};
      if (typeof attributes !== "object" || Array.isArray(attributes)) {
        throw new Error("Attributes must be a JSON object");
      }
    } catch (err) {
      setError("Attributes: " + err.message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attributes }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const created = await res.json();
      onAdded?.(created);
      setForm(EMPTY);
      setAttributesText("{}");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 10, maxWidth: 420 }}
    >
      <h3>Add Item</h3>

      <label>
        Title *
        <input
          name="title"
          value={form.title}
          onChange={update}
          required
          autoFocus
        />
      </label>

      <label>
        Category
        <select name="category" value={form.category} onChange={update}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <input name="status" value={form.status} onChange={update} />
      </label>

      <label>
        Condition
        <input name="condition" value={form.condition} onChange={update} />
      </label>

      <label>
        Cover URL
        <input
          name="cover_url"
          type="url"
          value={form.cover_url}
          onChange={update}
          placeholder="https://..."
        />
      </label>

      <label>
        Notes
        <textarea
          name="notes"
          value={form.notes}
          onChange={update}
          rows={3}
        />
      </label>

      <label>
        Attributes (JSON object)
        <textarea
          value={attributesText}
          onChange={(e) => setAttributesText(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder='{"platform": "PS5", "year": 2023}'
        />
      </label>

      {error && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</div>
      )}

      <button type="submit" disabled={submitting || !form.title.trim()}>
        {submitting ? "Saving…" : "Add Item"}
      </button>
    </form>
  );
}